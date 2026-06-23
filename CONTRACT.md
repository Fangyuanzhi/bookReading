# 陪读后端 · 开发合约 (Development Contract)

> 参考 OpenSpec 风格 | 版本: MVP-v0.1 | 日期: 2026-06-20

---

## 1. 项目概述

### 1.1 目标
构建「陪读」氛围陪伴式读书社区的 Go 后端服务，支撑核心阅读体验：
- 用户认证与管理
- 书籍/章节内容管理
- 段评（CFI 锚定）与实时推送
- 章末书评与互动
- 「N 人在读」实时在场

### 1.2 技术栈锁定
| 层级 | 选型 | 版本 |
|------|------|------|
| 语言 | Go | 1.22+ |
| Web 框架 | Gin | v1.9+ |
| ORM | GORM | v1.25+ |
| 数据库 | PostgreSQL | 16 |
| 缓存 | Redis | 7 |
| 实时 | Centrifugo | v5 |
| 对象存储 | MinIO | latest |
| 配置 | Viper | v1.17+ |
| 日志 | Zap | v1.26+ |

### 1.3 非目标 (Out of Scope)
- 全文搜索 (ES 后置)
- 推荐算法
- UGC 作者后台
- 支付/订阅
- 移动端 App

---

## 2. 架构契约

### 2.1 分层架构
```
HTTP Request
    ↓
[Handler] → 参数校验 → 调用 Service
    ↓
[Service] → 业务逻辑 → 调用 Repository
    ↓
[Repository] → 数据访问 → GORM/Redis/MinIO
    ↓
[Model] → 实体定义
```

### 2.2 接口规范
- REST API，JSON 格式
- 统一响应: `{code, message, data}`
- HTTP 状态码: 200(成功), 400(参数错误), 401(未认证), 403(无权限), 500(服务器错误)
- 认证: JWT Bearer Token

### 2.3 数据库契约
- 直接使用 `supabase/schema.sql` 的表结构
- GORM 自动迁移 (AutoMigrate)
- RLS 逻辑在应用层通过 user_id 过滤实现

---

## 3. 任务分段 (Phased Tasks)

### Phase 1: 基础设施 (Foundation)
**目标**: 可运行的空服务

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P1-1 | 项目骨架 | 目录结构, go.mod | `go build` 成功 |
| P1-2 | Docker Compose | docker-compose.yml | `docker-compose up` 启动 PG/Redis/MinIO/Centrifugo |
| P1-3 | 配置管理 | config.yaml, config/ 包 | 多环境配置加载 (dev/prod) |
| P1-4 | 日志系统 | logger/ 包 | 结构化日志输出到 stdout |
| P1-5 | 数据库连接 | database/ 包 | GORM 连接 PG，自动迁移成功 |
| P1-6 | 健康检查 API | GET /health | 返回 `{status: "ok"}` |

**状态**: ✅ 已完成
**实际用时**: 30 分钟

---

### Phase 2: 认证体系 (Auth)
**目标**: 用户可注册/登录/获取 Token

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P2-1 | JWT 工具 | pkg/jwt/ | 生成/解析/验证 Token |
| P2-2 | 密码加密 | bcrypt | 密码哈希存储 |
| P2-3 | 注册 API | POST /auth/register | 创建用户，返回用户信息 |
| P2-4 | 登录 API | POST /auth/login | 验证密码，返回 JWT |
| P2-5 | 认证中间件 | middleware/auth.go | 保护路由，注入 user_id |
| P2-6 | 获取当前用户 | GET /auth/me | 返回当前登录用户信息 |

**状态**: ✅ 已完成
**实际用时**: 20 分钟

---

### Phase 3: 内容管理 (Content)
**目标**: 书籍/章节 CRUD，EPUB 上传解析

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P3-1 | 书籍模型 | model/book.go | 对应 schema.sql books 表 |
| P3-2 | 章节模型 | model/chapter.go | 对应 schema.sql chapters 表 |
| P3-3 | 书籍列表 API | GET /books | 分页，支持搜索 |
| P3-4 | 书籍详情 API | GET /books/:id | 包含章节列表 |
| P3-5 | 章节内容 API | GET /chapters/:id | 返回章节内容 |
| P3-6 | EPUB 上传 | POST /books/upload | 保存到 MinIO，解析章节入库 |
| P3-7 | 管理员权限 | middleware/auth.go | 仅创建者可管理自己的书 |

**状态**: ✅ 已完成
**实际用时**: 40 分钟

---

### Phase 4: 段评系统 (Notes) - 核心
**目标**: CFI 锚定的段评，实时推送

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P4-1 | 段评模型 | model/note.go | 对应 schema.sql notes 表 |
| P4-2 | 创建段评 API | POST /notes | 存储 CFI + text_quote + body |
| P4-3 | 获取段评 API | GET /chapters/:id/notes | 按 chapter_id 查询 |
| P4-4 | 段评点亮 | POST /notes/:id/like | 点赞/取消点赞 |
| P4-5 | Centrifugo 集成 | pkg/centrifugo/ | 服务端推送新段评 |
| P4-6 | 实时订阅 | Centrifugo | 同章用户实时收到新段评（基础框架） |

**状态**: ✅ 已完成（基础版）
**实际用时**: 50 分钟
**说明**: Centrifugo 客户端已集成，推送代码已添加。完整实时测试需要启动 Centrifugo 服务

---

### Phase 5: 书评与互动 (Reviews)
**目标**: 章末书评，互动点亮

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P5-1 | 书评模型 | model/review.go | 对应 schema.sql reviews 表 |
| P5-2 | 创建书评 API | POST /reviews | 章末/全书书评 |
| P5-3 | 获取书评 API | GET /books/:id/reviews | 分页，按时间/热度排序 |
| P5-4 | 书评点亮 | POST /reviews/:id/like | 点赞/取消点赞 |
| P5-5 | 实时推送 | Centrifugo | 新书评实时推送 |

**状态**: ✅ 已完成
**实际用时**: 30 分钟

---

### Phase 6: 实时在场 (Presence)
**目标**: 「N 人在读这一章」

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P6-1 | 阅读进度 API | POST /progress | 更新当前阅读位置 |
| P6-2 | Centrifugo Presence | 配置 | 频道 `chapter:{id}` 成员计数 |
| P6-3 | 在场人数 API | GET /chapters/:id/presence | 返回当前在线人数 |
| P6-4 | 前端 SDK 接入 | 文档 | 前端可订阅 presence |

**状态**: ✅ 已完成
**实际用时**: 25 分钟
**说明**: Centrifugo 频道已配置，前端可通过 WebSocket 订阅 `chapter:{id}` 频道接收实时更新

---

### Phase 7: 安全与优化 (Hardening)
**目标**: 限频、安全、文档

| ID | 任务 | 交付物 | 验收标准 |
|----|------|--------|----------|
| P7-1 | 限频中间件 | middleware/ratelimit.go | IP + 用户级别限频 |
| P7-2 | 输入校验 | validator/ | 统一参数校验 |
| P7-3 | 错误处理 | 统一错误码 | 不暴露内部错误 |
| P7-4 | API 文档 | docs/API.md | 接口文档 |
| P7-5 | 部署文档 | docs/DEPLOY.md | 部署指南 |

**状态**: ✅ 已完成
**实际用时**: 20 分钟

---

## 4. 里程碑 (Milestones)

| 里程碑 | 包含 Phase | 交付物 | 时间 |
|--------|-----------|--------|------|
| M1: 骨架可用 | P1 | 可运行的空服务 | Day 1 |
| M2: 用户可用 | P1-P2 | 可注册登录 | Day 2 |
| M3: 内容可用 | P1-P3 | 可看书籍章节 | Day 4 |
| M4: 核心可用 | P1-P4 | 可发段评，实时推送 | Day 6 |
| M5: 社交可用 | P1-P5 | 可写书评，互动 | Day 7 |
| M6: MVP 完成 | P1-P7 | 完整后端 + 文档 | Day 8 |

---

## 5. 接口契约示例

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "invalid parameter: email",
  "data": null
}
```

### 认证头
```
Authorization: Bearer <jwt_token>
```

---

## 6. 数据契约

### 核心表 (直接复用 schema.sql)
- `profiles` - 用户资料
- `books` - 书籍
- `chapters` - 章节
- `notes` - 段评 (CFI 锚定)
- `note_likes` - 段评点赞
- `reviews` - 书评
- `review_likes` - 书评点赞
- `reading_progress` - 阅读进度

---

## 7. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Centrifugo 学习成本 | 延迟 | 官方文档 + 示例代码 |
| EPUB 解析复杂 | 延迟 | 先用简单 ZIP+XML 解析，复杂格式后置 |
| CFI 定位不准 | 体验差 | 用 text_quote 兜底 |
| 并发性能 | 延迟 | MVP 先功能，压测后置 |

---

## 8. 签名

**开发者**: _______________  **日期**: _______________

**确认**: 以上契约双方认可，开发过程中可协商调整，重大变更需书面记录。
