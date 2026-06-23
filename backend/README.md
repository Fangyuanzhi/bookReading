# 陪读后端 (bookreading-backend)

Go + Gin + GORM 实现的「陪读」氛围陪伴式读书社区后端服务。

## 技术栈

- **Go 1.22+**
- **Gin** - Web 框架
- **GORM** - ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存
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

# Ping
curl http://localhost:8080/ping
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
| P2 | 认证体系 | ⏳ 待开发 |
| P3 | 内容管理 | ⏳ 待开发 |
| P4 | 段评系统 | ⏳ 待开发 |
| P5 | 书评互动 | ⏳ 待开发 |
| P6 | 实时在场 | ⏳ 待开发 |
| P7 | 安全优化 | ⏳ 待开发 |

## API 文档

详见 `docs/API.md` (开发中)

## License

MIT