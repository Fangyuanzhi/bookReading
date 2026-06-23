#!/bin/bash

# 陪读后端部署脚本

set -e

echo "🚀 开始部署陪读后端..."

# 检查环境变量
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️ 警告: JWT_SECRET 未设置，使用默认值（生产环境请修改）"
    export JWT_SECRET="change-this-secret-in-production"
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️ 警告: DB_PASSWORD 未设置，使用默认值（生产环境请修改）"
    export DB_PASSWORD="peidu123"
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p logs

# 检查 Docker 和 Docker Compose
echo "🐳 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 拉取最新代码（如果是 git 仓库）
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build

# 停止旧服务
echo "🛑 停止旧服务..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# 启动服务
echo "▶️ 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🏥 健康检查..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose -f docker-compose.prod.yml logs api
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "服务地址:"
echo "  - API: http://localhost:8080"
echo "  - Centrifugo: http://localhost:8000"
echo ""
echo "查看日志:"
echo "  docker-compose -f docker-compose.prod.yml logs -f api"
echo ""
echo "停止服务:"
echo "  docker-compose -f docker-compose.prod.yml down"
