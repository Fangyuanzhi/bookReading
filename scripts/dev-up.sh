#!/usr/bin/env bash
# 陪读本地开发环境一键启动
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

echo "==> 1/4 启动 Docker 依赖 (postgres, redis, minio, centrifugo)"
cd "$BACKEND"
docker-compose up -d

echo "==> 等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
  if docker exec peidu-postgres pg_isready -U peidu -d peidu >/dev/null 2>&1; then
    echo "    PostgreSQL OK"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: PostgreSQL 启动超时" >&2
    exit 1
  fi
  sleep 1
done

echo "==> 2/4 启动后端 API (:8080)"
if pgrep -f 'go run.*cmd/api' >/dev/null 2>&1 || pgrep -f 'bin/api' >/dev/null 2>&1; then
  echo "    后端已在运行，跳过"
else
  cd "$BACKEND"
  nohup go run ./cmd/api >"$LOG_DIR/backend-dev.log" 2>&1 &
  echo $! >"$LOG_DIR/backend.pid"
  echo "    PID $(cat "$LOG_DIR/backend.pid"), 日志: $LOG_DIR/backend-dev.log"
fi

echo "==> 等待后端健康检查..."
for i in $(seq 1 40); do
  if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
    echo "    后端 OK"
    break
  fi
  if [ "$i" -eq 40 ]; then
    echo "ERROR: 后端启动超时，查看 $LOG_DIR/backend-dev.log" >&2
    tail -30 "$LOG_DIR/backend-dev.log" >&2 || true
    exit 1
  fi
  sleep 1
done

echo "==> 3/4 安装前端依赖 (如需)"
cd "$FRONTEND"
if [ ! -d node_modules ]; then
  npm install
fi

echo "==> 4/4 启动前端 (:3000)"
if pgrep -f 'vite' >/dev/null 2>&1; then
  echo "    前端已在运行，跳过"
else
  nohup npm run dev >"$LOG_DIR/frontend-dev.log" 2>&1 &
  echo $! >"$LOG_DIR/frontend.pid"
  echo "    PID $(cat "$LOG_DIR/frontend.pid"), 日志: $LOG_DIR/frontend-dev.log"
fi

echo ""
echo "=========================================="
echo "  陪读本地环境已启动"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8080"
echo "  健康: curl http://localhost:8080/health"
echo "  联调: bash scripts/smoke-test.sh"
echo "=========================================="
