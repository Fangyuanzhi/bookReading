# 陪读后端 API 文档

> 版本: v1.0.0 | 日期: 2026-06-20

## 基础信息

- **Base URL**: `http://localhost:8080/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

## 认证

### 获取 Token

登录或注册后获取 JWT Token，在后续请求的 Header 中添加：

```
Authorization: Bearer <token>
```

---

## API 列表

### 1. 认证 (Auth)

#### POST /auth/register
用户注册

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "username": "username",
  "display_name": "显示名称"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "username",
      "display_name": "显示名称",
      "avatar_url": "",
      "created_at": "2026-06-20T10:00:00Z"
    }
  }
}
```

#### POST /auth/login
用户登录

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**响应:** 同注册

#### GET /auth/me
获取当前用户信息

**Header:** `Authorization: Bearer <token>`

---

### 2. 书籍 (Books)

#### GET /books
获取书籍列表

**查询参数:**
- `page`: 页码 (默认: 1)
- `page_size`: 每页数量 (默认: 20)
- `search`: 搜索关键词

**响应:**
```json
{
  "code": 200,
  "data": {
    "books": [...],
    "total": 100,
    "page": 1
  }
}
```

#### GET /books/:id
获取书籍详情

#### POST /books
创建书籍 (需认证)

**请求体:**
```json
{
  "title": "书名",
  "author": "作者",
  "description": "简介",
  "source": "public_domain"
}
```

#### PUT /books/:id
更新书籍 (需认证，仅创建者)

#### DELETE /books/:id
删除书籍 (需认证，仅创建者)

#### GET /books/:id/chapters
获取书籍章节列表

#### GET /books/:id/reviews
获取书籍书评列表

---

### 3. 章节 (Chapters)

#### GET /chapters/:id
获取章节详情

#### GET /chapters/:id/notes
获取章节段评列表

#### GET /chapters/:id/reviews
获取章节书评列表

#### GET /chapters/:id/presence
获取章节在场人数

**响应:**
```json
{
  "code": 200,
  "data": {
    "count": 42,
    "users": ["user-id-1", "user-id-2"]
  }
}
```

#### POST /chapters/:id/join
加入章节阅读 (需认证)

#### POST /chapters/:id/leave
离开章节 (需认证)

---

### 4. 段评 (Notes)

#### POST /notes
创建段评 (需认证)

**请求体:**
```json
{
  "book_id": "book-uuid",
  "chapter_id": "chapter-uuid",
  "cfi": "epubcfi(/6/2[id4]!/4/2)",
  "text_quote": "被划选的原文",
  "body": "我的想法",
  "is_public": true
}
```

#### GET /notes/:id
获取段评详情

#### PUT /notes/:id
更新段评 (需认证，仅作者)

#### DELETE /notes/:id
删除段评 (需认证，仅作者)

#### POST /notes/:id/like
点赞段评 (需认证)

#### DELETE /notes/:id/like
取消点赞 (需认证)

---

### 5. 书评 (Reviews)

#### POST /reviews
创建书评 (需认证)

**请求体:**
```json
{
  "book_id": "book-uuid",
  "chapter_id": "chapter-uuid",
  "body": "书评内容"
}
```

#### GET /reviews/:id
获取书评详情

#### PUT /reviews/:id
更新书评 (需认证，仅作者)

#### DELETE /reviews/:id
删除书评 (需认证，仅作者)

#### POST /reviews/:id/like
点赞书评 (需认证)

#### DELETE /reviews/:id/like
取消点赞 (需认证)

---

### 6. 在场 (Presence)

#### POST /presence/heartbeat
心跳保活 (需认证)

**请求体:**
```json
{
  "chapter_id": "chapter-uuid"
}
```

---

## 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 实时推送 (WebSocket)

使用 Centrifugo 实现实时推送。

### 连接信息

- **WebSocket URL**: `ws://localhost:8000/connection/websocket`
- **频道格式**: 
  - 章节: `chapter:{chapter_id}`
  - 书籍: `book:{book_id}`

### 推送消息类型

#### note_created
新段评创建

```json
{
  "type": "note_created",
  "data": {
    "id": "note-uuid",
    "cfi": "epubcfi(...)",
    "body": "想法内容",
    "user": {...}
  }
}
```

#### review_created
新书评创建

```json
{
  "type": "review_created",
  "data": {
    "id": "review-uuid",
    "body": "书评内容",
    "user": {...}
  }
}
```

#### presence_update
在场人数更新

```json
{
  "type": "presence_update",
  "data": {
    "count": 42,
    "user_joined": "用户名"
  }
}
```

---

## 限流说明

- **IP 限流**: 每秒 10 个请求，突发 20 个
- **认证接口限流**: 每秒 2 个请求，突发 5 个
- **触发限流**: 返回 HTTP 429

---

## 部署说明

见 [DEPLOY.md](./DEPLOY.md)
