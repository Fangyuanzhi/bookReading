#!/usr/bin/env bash
# M4a：安装 RN 依赖并生成 Expo 图标资源
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app"
ICONS_SRC="$ROOT/store-listing/assets/icons"
ASSETS="$APP/assets"

echo "==> M4a setup: $APP"

mkdir -p "$ASSETS"

# 从 store-listing 生成 master PNG（若无则跳过）
if [[ -f "$ICONS_SRC/generate-icons.mjs" ]]; then
  echo "==> 生成商店图标（复用为 App icon）"
  (cd "$ICONS_SRC" && npm install sharp --no-save 2>/dev/null || true)
  if [[ -f "$ICONS_SRC/icon-master.svg" ]] || [[ -f "$ICONS_SRC/icon-master.png" ]]; then
    (cd "$ICONS_SRC" && node generate-icons.mjs 2>/dev/null || true)
  fi
  if [[ -f "$ICONS_SRC/generated/ios-1024.png" ]]; then
    cp "$ICONS_SRC/generated/ios-1024.png" "$ASSETS/icon.png"
    cp "$ICONS_SRC/generated/ios-1024.png" "$ASSETS/adaptive-icon.png"
    cp "$ICONS_SRC/generated/ios-1024.png" "$ASSETS/splash-icon.png"
    echo "    已复制 icon / splash"
  fi
fi

# 若无图标，用 ImageMagick 或 sharp 生成占位（可选）
if [[ ! -f "$ASSETS/icon.png" ]]; then
  echo "==> 未找到 icon-master，创建蓝色占位图标"
  if command -v convert &>/dev/null; then
    convert -size 1024x1024 xc:'#2563EB' \
      -gravity center -pointsize 200 -fill white -annotate 0 '陪' \
      "$ASSETS/icon.png"
    cp "$ASSETS/icon.png" "$ASSETS/adaptive-icon.png"
    cp "$ASSETS/icon.png" "$ASSETS/splash-icon.png"
  else
    echo "    警告: 请手动放入 $ASSETS/icon.png（1024×1024）"
  fi
fi

echo "==> npm install (Expo app)"
cd "$APP"
npm install

echo ""
echo "✅ M4a 就绪。下一步:"
echo "   cd $APP && npm start"
echo ""
echo "真机调试请创建 app/.env:"
echo "   EXPO_PUBLIC_API_URL=http://<你的电脑IP>:8080/api/v1"
