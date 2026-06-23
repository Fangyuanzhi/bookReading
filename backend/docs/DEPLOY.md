# 陪读后端部署指南

## 快速部署（推荐）

### 1. 使用 Docker Compose（生产环境）

```bash
# 1. 克隆代码
git clone <your-repo-url>
cd bookReading/backend

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改密钥和密码

# 3. 运行部署脚本
./deploy.sh
```

### 2. 手动部署

```bash
# 1. 设置环境变量
export JWT_SECRET="your-secret-key"
export DB_PASSWORD="your-db-password"

# 2. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 检查状态
curl http://localhost:8080/health
```

## 服务架构

```
┌─────────────────────────────────────────┐
│              Nginx/Caddy                │
│         (HTTPS/反向代理)                 │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│              API (Go)                   │
│         Port: 8080                      │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼────┐ ┌──▼──────┐
│PostgreSQL│ │ Redis │ │Centrifugo│
│ 5432   │ │ 6379  │ │  8000   │
└────────┘ └───────┘ └─────────┘
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| JWT_SECRET | JWT 签名密钥 | 必须修改 |
| DB_PASSWORD | 数据库密码 | 必须修改 |
| MINIO_ACCESS_KEY | MinIO 访问密钥 | peidu |
| MINIO_SECRET_KEY | MinIO 密钥 | 必须修改 |
| CENTRIFUGO_API_KEY | Centrifugo API 密钥 | 必须修改 |

## 生产环境检查清单

- [ ] 修改 JWT_SECRET
- [ ] 修改 DB_PASSWORD
- [ ] 修改 MINIO_SECRET_KEY
- [ ] 修改 CENTRIFUGO_API_KEY
- [ ] 配置 HTTPS
- [ ] 配置防火墙（只开放 80/443）
- [ ] 配置日志轮转
- [ ] 配置监控告警
- [ ] 配置数据库备份

## 常用命令

```bash
# 查看日志
docker-compose -f docker-compose.prod.yml logs -f api

# 重启服务
docker-compose -f docker-compose.prod.yml restart api

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 更新部署
git pull
./deploy.sh

# 数据库备份
docker exec peidu-postgres-prod pg_dump -U peidu peidu > backup.sql

# 数据库恢复
docker exec -i peidu-postgres-prod psql -U peidu peidu < backup.sql
```

## 健康检查

```bash
# API 健康
curl http://localhost:8080/health

# 数据库连接
docker exec peidu-postgres-prod pg_isready -U peidu

# Redis 连接
docker exec peidu-redis-prod redis-cli ping
```

## 故障排查

### 服务启动失败

```bash
# 查看日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tlnp | grep 8080
```

### 数据库连接失败

```bash
# 检查数据库状态
docker exec peidu-postgres-prod pg_isready -U peidu

# 重置数据库（会丢失数据）
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```
