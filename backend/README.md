# 陪读后端 (bookreading-backend)

Go + Gin + GORM 实现的「陪读」氛围陪伴式读书社区后端服务。

## 技术栈

- **Go 1.22+**
- **Gin** - Web 框架
- **GORM** - ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存 / 在场
- **Centrifugo** - 实时消息 (WebSocket)
- **MinIO** - 对象存储

## 快速开始

### 1. 启动依赖服务

```bash
docker-compose up -d
```

这会启动 PostgreSQL、Redis、MinIO 和 Centrifugo。

### 2. 运行后端

```bash
# 开发模式
go run ./cmd/api

# 或构建后运行
go build -o bin/api ./cmd/api
./bin/api
```

服务默认运行在 `:8080`。

### 3. 测试

```bash
# 健康检查
curl http://localhost:8080/health

# 单元测试
go test ./...
```

## 项目结构

```
backend/
├── cmd/api/              # 主入口
├── internal/
│   ├── config/           # 配置管理
│   ├── database/         # 数据库连接
│   ├── handler/          # HTTP 处理器
│   ├── middleware/       # 中间件
│   ├── model/            # 数据模型
│   ├── repository/       # 数据访问层
│   └── service/          # 业务逻辑层
├── pkg/
│   ├── jwt/              # JWT 工具
│   ├── logger/           # 日志
│   ├── response/         # 统一响应
│   └── validator/        # 参数校验
├── docker-compose.yml    # 依赖服务
├── Dockerfile            # 构建镜像
└── config.yaml           # 配置文件
```

## 开发阶段

| Phase | 内容 | 状态 |
|-------|------|------|
| P1 | 基础设施 | ✅ 完成 |
| P2 | 认证体系 | ✅ 完成 |
| P3 | 内容管理 + EPUB/TXT 导入 | ✅ 完成 |
| P4 | 段评系统 | ✅ 完成 |
| P5 | 书评互动 | ✅ 完成 |
| P6 | 实时在场 | ✅ 完成 |
| P7 | 阅读进度 + 举报合规 | ✅ 完成 |
| P8 | 安全加固 / 生产化 | ⏳ 部分完成（密码策略、限流、超时、RequestID、JWT 环境变量） |

## 主要 API

| 模块 | 端点 |
|------|------|
| 认证 | `POST /api/v1/auth/register`, `login`, `GET /me` |
| 书籍 | `GET/POST /api/v1/books`, `GET /books/:id/chapters` |
| 阅读进度 | `GET /reading/progress`, `PUT /books/:id/progress` |
| 段评 | `GET/POST /api/v1/notes` |
| 书评 | `GET/POST /api/v1/reviews` |
| 在场 | `GET /chapters/:id/presence`, `POST /presence/heartbeat` |
| 上传 | `POST /api/v1/upload/book` (EPUB/TXT) |
| 举报 | `POST /api/v1/reports` |
| 搜索 | `GET /api/v1/search` |

## License

MIT
