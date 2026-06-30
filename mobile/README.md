# 陪读 · 原生 App（M4）

**React Native (Expo)** 真原生 UI + 应用商店上架素材。

| 阶段 | 内容 | 状态 |
|------|------|------|
| **M4a** | Expo RN：登录 / 书库 / 阅读器骨架 | ✅ `app/` |
| **M4b** | WebSocket 实时 + 离线缓存 + 阅读进度 | ✅ `app/` |
| M4c | App Store / 应用宝上架素材 | ✅ `store-listing/` |

## 技术选型

- **M4a**：Expo SDK 52 + React Navigation（非 Capacitor 套壳）
- 阅读器：章节 API 纯文本段落 + 段评（foliate-js 仅 Web）
- API：复用 `backend` Go 服务，`/api/v1`

## 目录

```
mobile/
├── README.md           # 本文件
├── setup-m4a.sh        # 一键安装 + 图标
├── app/                # Expo React Native 工程 → 见 app/README.md
└── store-listing/      # M4c 上架素材包
```

## 快速开始（M4a）

```bash
# 后端
cd ../backend && docker-compose up -d

# RN App
cd ../mobile
chmod +x setup-m4a.sh && ./setup-m4a.sh
cd app && npm start
```

## 商店链接（上线后填写）

| 平台 | URL |
|------|-----|
| App Store | _待填_ |
| 应用宝 | _待填_ |
| 隐私政策 | `https://<你的域名>/privacy` |

## M4c 素材

见 [`store-listing/README.md`](store-listing/README.md) 与 [`CHECKLIST.md`](store-listing/CHECKLIST.md)。
