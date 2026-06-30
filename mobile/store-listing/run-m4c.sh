#!/usr/bin/env bash
# M4c 上架素材一键生成（图标 + 可选截图）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ICONS="$ROOT/assets/icons"
SHOTS="$ROOT/assets/screenshots"
FRONTEND="$ROOT/../../frontend"
BACKEND="$ROOT/../../backend"

step() { echo ""; echo "==> $*"; }

step "1/3 生成各平台图标"
cd "$ICONS"
if [[ ! -f icon-master.png && ! -f icon-master.svg ]]; then
  echo "错误: 缺少 icon-master.png 或 icon-master.svg"
  exit 1
fi
npm install sharp --no-save --prefix "$ICONS" 2>/dev/null || npm install sharp --no-save
node generate-icons.mjs
echo "图标已输出到 assets/icons/ios/ 与 assets/icons/android/"

if [[ "${1:-}" == "--icons-only" ]]; then
  step "完成（仅图标）"
  exit 0
fi

step "2/3 检查前后端"
if ! curl -sf "http://localhost:3000" >/dev/null 2>&1; then
  echo "前端未运行。另开终端执行:"
  echo "  cd $FRONTEND && npm run dev"
  echo "然后重新运行: $0"
  exit 1
fi
if ! curl -sf "http://localhost:8080/health" >/dev/null 2>&1; then
  echo "后端未运行（可选）。另开终端执行:"
  echo "  cd $BACKEND && docker-compose up -d"
  echo "继续截图（部分页面可能无数据）…"
fi

step "3/3 抓取商店截图"
cd "$SHOTS"
npm install playwright sharp --no-save --prefix "$SHOTS" 2>/dev/null || npm install playwright sharp --no-save
npx playwright install chromium
node capture.mjs

step "全部完成"
echo "  图标: $ICONS/ios/  $ICONS/android/"
echo "  截图: $SHOTS/ios/  $SHOTS/android/"
echo "  应用宝宣传图: 浏览器打开 $SHOTS/promo-template.html 导出 1080×540"
