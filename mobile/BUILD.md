# 陪读 App 本地构建指南

## 当前状态

| 项目 | 状态 |
|------|------|
| RN 代码 + 图标 | ✅ 就绪 |
| Android 原生工程 | 首次构建时 `expo prebuild` 自动生成 |
| Android SDK | 需本机安装（见下方） |
| 可下载 APK | 运行构建脚本后生成 |

---

## 三步出 APK（WSL / Linux）

### 1. 安装 Android SDK（无需 Android Studio GUI）

```bash
cd /home/fanghaitao/.openclaw/workspace/bookReading/mobile
chmod +x setup-android-sdk.sh build-android.sh
./setup-android-sdk.sh
```

按脚本提示把 `ANDROID_HOME` 写入 `~/.bashrc`，然后：

```bash
source ~/.bashrc
```

### 2. 配置真机 API 地址

手机不能访问 `localhost`，构建前创建 `app/.env`：

```bash
cat > app/.env <<'EOF'
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1
EXPO_PUBLIC_WS_URL=ws://192.168.x.x:8000/connection/websocket
EOF
```

把 `192.168.x.x` 换成你电脑的局域网 IP（`ip addr` 或 `hostname -I` 查看）。

同时确保后端已启动：

```bash
cd ../../backend && docker-compose up -d
```

### 3. 构建 APK

**首次推荐 Debug 包（最快、免签名）：**

```bash
./build-android.sh --debug
```

**Release 包：**

```bash
./build-android.sh
```

成功后 APK 在：

```
bookReading/mobile/dist/peidu-debug.apk   # 或 peidu-release.apk
```

---

## 安装到手机

USB 连接并开启开发者模式：

```bash
adb devices
adb install -r dist/peidu-debug.apk
```

或直接复制 `dist/peidu-debug.apk` 到手机安装（需允许「未知来源」）。

---

## 已安装 Android Studio 时

若已通过 Android Studio 安装 SDK，通常只需：

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
./build-android.sh --debug
```

---

## 常见问题

### `ANDROID_HOME` 已设置但仍报错

```bash
ls $ANDROID_HOME/platform-tools/adb
ls $ANDROID_HOME/platforms
```

### Release 构建报签名错误

先用 Debug：

```bash
./build-android.sh --debug
```

### App 打开但无法登录/加载

- 检查 `app/.env` 里的 IP 是否正确
- 手机和电脑是否同一 Wi-Fi
- 后端 `docker-compose ps` 是否在跑
- Android 已配置 `usesCleartextTraffic`（HTTP 内测可用）

### iOS

需 macOS + Xcode，WSL 无法本地打 IPA。可用 EAS 云构建。

---

## 一键命令（复制粘贴）

```bash
cd /home/fanghaitao/.openclaw/workspace/bookReading/mobile
./setup-android-sdk.sh          # 仅首次
source ~/.bashrc                # 配置 ANDROID_HOME 后
# 编辑 app/.env 填入局域网 IP
./build-android.sh --debug
```
