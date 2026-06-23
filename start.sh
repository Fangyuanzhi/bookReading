#!/usr/bin/env bash
# 陪读 · 一键启动/停止（开发环境）
# 用法:
#   ./start.sh          启动基础设施 + 后端 + 前端
#   ./start.sh start    同上
#   ./start.sh stop     停止后端和前端（保留 Docker 基础设施）
#   ./start.sh stop --all  停止全部（含 Docker）
#   ./start.sh restart  重启后端和前端
#   ./start.sh status   查看运行状态

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
RUN_DIR="$ROOT/.run"
LOG_DIR="$ROOT/logs"

BACKEND_PID="$RUN_DIR/backend.pid"
FRONTEND_PID="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*" >&2; }

mkdir -p "$RUN_DIR" "$LOG_DIR"

docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$BACKEND_DIR/docker-compose.yml" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$BACKEND_DIR/docker-compose.yml" "$@"
  else
    err "未找到 docker compose，请先安装 Docker"
    exit 1
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | grep -q ":${port} "
  else
    lsof -i ":${port}" >/dev/null 2>&1
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local max="${3:-60}"
  local i=0

  while [ "$i" -lt "$max" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      ok "$name 已就绪"
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done

  err "$name 启动超时: $url"
  return 1
}

wait_for_docker_health() {
  local max=60
  local i=0

  log "等待 Docker 基础设施就绪..."
  while [ "$i" -lt "$max" ]; do
    if docker_compose ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
      local healthy
      healthy="$(docker_compose ps --format '{{.Service}}:{{.Health}}' 2>/dev/null | grep -c 'healthy' || true)"
      if [ "${healthy:-0}" -ge 4 ]; then
        ok "Docker 基础设施已就绪"
        return 0
      fi
    fi
    i=$((i + 1))
    sleep 1
  done

  warn "部分 Docker 服务可能尚未 healthy，继续尝试启动应用..."
}

check_prerequisites() {
  local missing=0

  for cmd in docker curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      err "缺少命令: $cmd"
      missing=1
    fi
  done

  if ! command -v go >/dev/null 2>&1; then
    err "缺少 Go，请先安装 Go 1.22+"
    missing=1
  fi

  if ! command -v node >/dev/null 2>&1; then
    err "缺少 Node.js，请先安装 Node 18+"
    missing=1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    err "缺少 npm"
    missing=1
  fi

  [ "$missing" -eq 0 ] || exit 1
}

stop_process() {
  local name="$1"
  local pid_file="$2"

  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      log "停止 $name (pid=$pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      ok "已停止 $name"
    fi
    rm -f "$pid_file"
  fi
}

stop_backend() {
  stop_process "后端" "$BACKEND_PID"
}

stop_frontend() {
  stop_process "前端" "$FRONTEND_PID"
}

stop_infra() {
  if ! docker info >/dev/null 2>&1; then
    warn "无法连接 Docker，跳过停止基础设施"
    return 0
  fi

  log "停止 Docker 基础设施..."
  docker_compose down
  ok "Docker 基础设施已停止"
}

start_infra() {
  if [ "${SKIP_INFRA:-0}" = "1" ]; then
    warn "跳过 Docker 基础设施 (SKIP_INFRA=1)"
    return 0
  fi

  if ! docker info >/dev/null 2>&1; then
    warn "无法连接 Docker（可能需要: sudo usermod -aG docker \$USER 后重新登录）"
    warn "将跳过基础设施启动；若 Postgres/Redis 等已在运行，后端仍可正常启动"
    return 0
  fi

  log "启动 Docker 基础设施 (Postgres / Redis / MinIO / Centrifugo)..."
  docker_compose up -d
  wait_for_docker_health
}

start_backend() {
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    warn "后端已在运行 (http://127.0.0.1:${BACKEND_PORT})，跳过启动"
    return 0
  fi

  if [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
    warn "后端已在运行 (pid=$(cat "$BACKEND_PID"))"
    return 0
  fi

  if port_in_use "$BACKEND_PORT"; then
    err "端口 $BACKEND_PORT 已被占用，请先执行 ./start.sh stop"
    exit 1
  fi

  log "启动 Go 后端 (端口 $BACKEND_PORT)..."
  (
    cd "$BACKEND_DIR"
    nohup go run ./cmd/api >>"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID"
  )

  wait_for_url "http://127.0.0.1:${BACKEND_PORT}/health" "后端 API"
}

start_frontend() {
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1; then
    warn "前端已在运行 (http://127.0.0.1:${FRONTEND_PORT})，跳过启动"
    return 0
  fi

  if [ -f "$FRONTEND_PID" ] && kill -0 "$(cat "$FRONTEND_PID")" 2>/dev/null; then
    warn "前端已在运行 (pid=$(cat "$FRONTEND_PID"))"
    return 0
  fi

  if port_in_use "$FRONTEND_PORT"; then
    err "端口 $FRONTEND_PORT 已被占用，请先执行 ./start.sh stop"
    exit 1
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "首次运行，安装前端依赖..."
    (cd "$FRONTEND_DIR" && npm install)
  fi

  log "启动 Vite 前端 (端口 $FRONTEND_PORT)..."
  (
    cd "$FRONTEND_DIR"
    nohup npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >>"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID"
  )

  wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/" "前端"
}

print_status() {
  echo ""
  echo "========== 陪读 运行状态 =========="

  if docker info >/dev/null 2>&1; then
    if docker_compose ps --status running 2>/dev/null | grep -q .; then
      ok "Docker: 运行中"
      docker_compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || docker_compose ps
    else
      warn "Docker: 未运行"
    fi
  else
    warn "Docker: 不可用"
  fi

  if [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
    ok "后端: 运行中 (pid=$(cat "$BACKEND_PID"), http://127.0.0.1:${BACKEND_PORT})"
  elif curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    ok "后端: 运行中 (http://127.0.0.1:${BACKEND_PORT})"
  else
    warn "后端: 未运行"
  fi

  if [ -f "$FRONTEND_PID" ] && kill -0 "$(cat "$FRONTEND_PID")" 2>/dev/null; then
    ok "前端: 运行中 (pid=$(cat "$FRONTEND_PID"), http://127.0.0.1:${FRONTEND_PORT})"
  elif curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1; then
    ok "前端: 运行中 (http://127.0.0.1:${FRONTEND_PORT})"
  else
    warn "前端: 未运行"
  fi

  echo ""
  echo "日志:"
  echo "  后端: $BACKEND_LOG"
  echo "  前端: $FRONTEND_LOG"
  echo "=================================="
  echo ""
}

cmd_start() {
  check_prerequisites
  start_infra
  start_backend
  start_frontend

  echo ""
  ok "陪读已启动"
  echo ""
  echo "  前端:  http://127.0.0.1:${FRONTEND_PORT}"
  echo "  后端:  http://127.0.0.1:${BACKEND_PORT}"
  echo "  健康:  http://127.0.0.1:${BACKEND_PORT}/health"
  echo "  MinIO: http://127.0.0.1:9001"
  echo ""
  echo "查看日志:"
  echo "  tail -f $BACKEND_LOG"
  echo "  tail -f $FRONTEND_LOG"
  echo ""
  echo "停止:"
  echo "  ./start.sh stop"
  echo ""
}

cmd_stop() {
  stop_frontend
  stop_backend

  if [ "${1:-}" = "--all" ]; then
    stop_infra
  else
    warn "Docker 基础设施仍在运行（Postgres/Redis/MinIO/Centrifugo）"
    warn "如需一并停止: ./start.sh stop --all"
  fi

  ok "应用已停止"
}

cmd_restart() {
  stop_frontend
  stop_backend
  sleep 1
  start_backend
  start_frontend
  ok "已重启后端和前端"
}

main() {
  local cmd="${1:-start}"

  case "$cmd" in
    start)
      cmd_start
      ;;
    stop)
      cmd_stop "${2:-}"
      ;;
    restart)
      check_prerequisites
      cmd_restart
      print_status
      ;;
    status)
      print_status
      ;;
    *)
      echo "用法: $0 {start|stop|restart|status}"
      echo "      $0 stop --all   # 同时停止 Docker"
      exit 1
      ;;
  esac
}

main "$@"
