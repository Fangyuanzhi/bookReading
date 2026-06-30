#!/usr/bin/env bash
# 在 Linux/WSL 安装 Android SDK（无需 Android Studio GUI）
set -euo pipefail

SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
CMDLINE_VERSION="11076708"
CMDLINE_ZIP="commandlinetools-linux-${CMDLINE_VERSION}_latest.zip"
CMDLINE_URL="https://dl.google.com/android/repository/${CMDLINE_ZIP}"

echo "==> 安装 Android SDK 到: $SDK_ROOT"

mkdir -p "$SDK_ROOT/cmdline-tools"

if [[ ! -d "$SDK_ROOT/cmdline-tools/latest/bin" ]]; then
  echo "==> 下载 Android Command-line Tools..."
  TMP="$(mktemp -d)"
  curl -fsSL "$CMDLINE_URL" -o "$TMP/$CMDLINE_ZIP"
  unzip -q "$TMP/$CMDLINE_ZIP" -d "$TMP/extract"
  rm -rf "$SDK_ROOT/cmdline-tools/latest"
  mv "$TMP/extract/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  rm -rf "$TMP"
  echo "    ✓ cmdline-tools 已安装"
else
  echo "    ✓ cmdline-tools 已存在，跳过下载"
fi

export ANDROID_HOME="$SDK_ROOT"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
if [[ ! -x "$SDKMANAGER" ]]; then
  echo "❌ sdkmanager 不可用: $SDKMANAGER"
  exit 1
fi

echo "==> 接受 SDK 许可..."
yes | "$SDKMANAGER" --licenses >/dev/null || true

echo "==> 安装 SDK 组件（platform-tools / build-tools / platform）..."
"$SDKMANAGER" --install \
  "platform-tools" \
  "platforms;android-35" \
  "build-tools;35.0.0"

echo ""
echo "✅ Android SDK 安装完成"
echo ""
echo "请将以下内容写入 ~/.bashrc 或 ~/.zshrc："
echo ""
echo "  export ANDROID_HOME=$SDK_ROOT"
echo "  export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools"
echo ""
echo "然后执行: source ~/.bashrc"
echo "再运行: cd $(dirname "$0") && ./build-android.sh"
