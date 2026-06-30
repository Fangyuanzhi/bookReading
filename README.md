# 陪读 · 氛围陪伴式读书

一个让你感到「不是一个人在读」的小说阅读社区。和番茄、起点那种「刷文」不同，这里主打**氛围**与**陪伴**：暖光夜读的质感、可随时开关的「结伴 / 独自」、以及浮现在文字旁的他人想法。

> 当前为 **前后端分离 MVP**：Go 后端 + React 前端，核心阅读与社交陪伴链路已打通。

## 项目文档

- [`docs/PRD.md`](docs/PRD.md) — 产品需求文档
- [`docs/TECH-SPEC.md`](docs/TECH-SPEC.md) — 技术规约
- [`backend/README.md`](backend/README.md) — 后端 API 与部署
- [`supabase/schema.sql`](supabase/schema.sql) — 数据库 schema 参考

## 快速开始

### 1. 启动后端依赖

```bash
cd backend && docker-compose up -d
```

### 2. 启动后端 API

```bash
cd backend && go run ./cmd/api    # → http://localhost:8080
```

### 3. 启动前端

```bash
cd frontend && npm install && npm run dev   # → http://localhost:3000
```

需要 Node 18+、Go 1.22+、Docker。

## MVP 功能概览

| 功能 | 状态 |
|------|------|
| 注册 / 登录 | ✅ |
| 书库浏览 + 搜索 | ✅ |
| EPUB / TXT 导入 | ✅ |
| 阅读器（主题 / 字号 / 结伴开关） | ✅ |
| 段评 + 实时推送（Centrifugo） | ✅ |
| 章末书评 | ✅ |
| 实时在场（N 人在读） | ✅ |
| 继续阅读 / 进度记忆 | ✅ |
| 内容举报（避风港） | ✅ |
| 环境音（雨声 / 壁炉 / 咖啡馆） | ✅ |
| UGC 作者后台 | ✅ |
| 个人主页（被点亮 / 我的想法） | ✅ |

## 目录结构

```
bookReading/
├── backend/          # Go + Gin + PostgreSQL + Redis + Centrifugo
├── frontend/         # Vite + React + Tailwind
├── mobile/           # 原生 App（M4）· 商店上架素材见 store-listing/
├── data/             # 公版书数据（如《理想国》）
├── docs/             # PRD、技术规约
└── supabase/         # Schema 参考
```

## 原生 App（M4）

| 阶段 | 说明 |
|------|------|
| M4a | **Expo React Native** 登录 / 书库 / 阅读器 → [`mobile/app/`](mobile/app/) |
| M4b | 推送 + 离线缓存 + WebSocket |
| M4c | App Store / 应用宝上架素材 → [`mobile/store-listing/`](mobile/store-listing/) |

```bash
cd mobile && chmod +x setup-m4a.sh && ./setup-m4a.sh && cd app && npm start
```

隐私政策页：`/privacy`（商店审核必填 URL）

## 技术栈

**后端：** Go、Gin、GORM、PostgreSQL、Redis、Centrifugo、MinIO

**前端：** Vite、React 18、Tailwind、lucide-react

## License

MIT。公版书籍内容请遵守相应版权协议。
