#!/usr/bin/env bash
# 本地构建 Android APK
# 用法:
#   ./build-android.sh           # Release APK
#   ./build-android.sh --debug   # Debug APK（推荐首次试装）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app"
MODE="release"
GRADLE_TASK="assembleRelease"
APK_REL="app/build/outputs/apk/release/app-release.apk"

for arg in "$@"; do
  case "$arg" in
    --debug)
      MODE="debug"
      GRADLE_TASK="assembleDebug"
      APK_REL="app/build/outputs/apk/debug/app-debug.apk"
      ;;
    --help|-h)
      echo "用法: $0 [--debug]"
      echo "  --debug  构建 Debug APK（无需签名，适合真机试装）"
      exit 0
      ;;
  esac
done

echo "==> 陪读 Android 本地构建 ($MODE)"
echo "    项目: $APP"

if [[ -z "${ANDROID_HOME:-}" ]]; then
  for candidate in "$HOME/Android/Sdk" "$HOME/Library/Android/sdk" "/opt/android-sdk"; do
    if [[ -d "$candidate/platform-tools" ]]; then
      export ANDROID_HOME="$candidate"
      break
    fi
  done
fi

if [[ -z "${ANDROID_HOME:-}" || ! -d "$ANDROID_HOME/platform-tools" ]]; then
  echo ""
  echo "❌ 未找到 Android SDK"
  echo ""
  echo "第一步 — 安装 SDK:"
  echo "  cd $ROOT && chmod +x setup-android-sdk.sh && ./setup-android-sdk.sh"
  echo ""
  echo "第二步 — 配置环境变量后重新打开终端，再运行本脚本"
  exit 1
fi

export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

if [[ ! -f "$APP/.env" ]]; then
  echo ""
  echo "⚠️  未找到 app/.env — 真机将无法访问 localhost API"
  echo "    请先创建，例如:"
  echo "    EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api/v1"
  echo ""
fi

cd "$APP"

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm install
fi

if [[ ! -d android ]]; then
  echo "==> expo prebuild (android)"
  npx expo prebuild --platform android --clean
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F'"' '/version/ {print $2}' | cut -d'.' -f1)
if [[ "$JAVA_VERSION" != "17" && "$JAVA_VERSION" != "21" ]]; then
  echo "⚠️  推荐 JDK 17 或 21，当前: $JAVA_VERSION"
fi

cd "$APP/android"
echo "==> ./gradlew $GRADLE_TASK"
./gradlew "$GRADLE_TASK" --no-daemon

APK="$APP/android/$APK_REL"
if [[ -f "$APK" ]]; then
  OUT="$ROOT/dist"
  mkdir -p "$OUT"
  cp "$APK" "$OUT/peidu-${MODE}.apk"
  echo ""
  echo "✅ 构建成功"
  echo "   $APK"
  echo "   $OUT/peidu-${MODE}.apk"
  ls -lh "$OUT/peidu-${MODE}.apk"
  echo ""
  echo "安装到已连接手机:"
  echo "   adb install -r $OUT/peidu-${MODE}.apk"
else
  echo "❌ 未找到 APK"
  exit 1
fi
