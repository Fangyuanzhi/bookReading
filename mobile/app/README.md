# 陪读 · React Native App（M4a + M4b）

Expo + React Navigation 原生 UI，对接现有 Go API。

## 功能

- 登录 / 注册（JWT + AsyncStorage）
- 书库列表 + 继续阅读
- **书架 Tab**：收藏书籍、搜索、继续阅读、移出书架
- **发现 Tab**：今日精选、热门段评/书评、活跃读者（可关注）、新书上架
- 书籍详情 + 章节目录 + 加入/移出书架
- 阅读器：段落滚动、护眼主题、段评发布
- **M4b**：Centrifugo 实时段评 + 在场人数、离线章节缓存、阅读进度同步

## 快速开始

```bash
# 1. 启动后端（含 Centrifugo :8000）
cd ../../backend && docker-compose up -d

# 2. 安装依赖 + 生成图标资源
cd ../mobile
chmod +x setup-m4a.sh
./setup-m4a.sh

# 3. 启动 Expo（真机请设 API 地址，见下）
cd app
npm start
```

按 `a` 开 Android 模拟器，`i` 开 iOS 模拟器，或 Expo Go 扫码真机调试。

## API / WebSocket 地址

| 环境 | API 默认 | WebSocket 默认 |
|------|----------|----------------|
| iOS 模拟器 | `http://localhost:8080/api/v1` | `ws://localhost:8000/connection/websocket` |
| Android 模拟器 | `http://10.0.2.2:8080/api/v1` | `ws://10.0.2.2:8000/connection/websocket` |
| 真机 | 宿主机局域网 IP | 同 hostname，端口 8000 |

真机 / 自定义：复制 `.env.example` → `.env`

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1
EXPO_PUBLIC_WS_URL=ws://192.168.x.x:8000/connection/websocket
```

## 目录

```
app/
├── App.tsx                 # 入口
├── src/
│   ├── api/                # API + Centrifugo WebSocket
│   ├── store/              # auth + offlineCache
│   ├── navigation/         # Stack + Tab
│   ├── screens/            # Login, Home, Shelf, Discover, BookDetail, Reader, Profile
│   ├── components/         # BookCard, ShelfBookCard, FollowButton, NotePanel…
│   ├── hooks/              # useChapter, useReadingProgress
│   └── theme/              # 设计 token（对齐 Web）
└── assets/                 # setup-m4a.sh 生成
```

## 与 Web 差异

| 能力 | Web | RN |
|------|-----|-----|
| foliate-js EPUB | ✅ | ❌ 走章节 API 纯文本 |
| 翻页模式 | ✅ | ❌ 仅滚动 |
| Centrifugo 实时 | ✅ | ✅ M4b |
| 离线缓存 | ❌ | ✅ AsyncStorage |
| 推送通知 | ❌ | ❌ 后续 |

## 下一步

- Expo Notifications 推送（新段评 / 关注动态）
- M4c 真机截图补全
