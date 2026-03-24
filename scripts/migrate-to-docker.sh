#!/bin/bash
# =====================================================================
# u-blog 迁移脚本：从 PM2 部署迁移到 Docker 部署
# 数据迁移：宿主机 PostgreSQL/Redis → Docker volume
# 备份文件位置：/tmp/ublog_backup.sql（PM2 迁移前已生成）
#
# 前置步骤：
#   1. 在项目目录下创建 .env 文件（cp .env.example .env 并填入值）
#   2. 备份宿主机 PostgreSQL/Redis 数据
#   3. 执行此脚本
# =====================================================================

set -e

PROJECT_DIR="/var/www/u-blog"
BACKUP_PG="/tmp/ublog_backup.sql"
BACKUP_REDIS="/tmp/ublog_redis_backup.rdb"

echo "=========================================="
echo "u-blog PM2 → Docker 迁移脚本"
echo "=========================================="

# ---- 0. 检查 .env 文件是否存在 ----
echo ""
echo "[0/7] 检查环境配置..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    # 兼容旧版：如果存在 .env.production 则自动重命名
    if [ -f "$PROJECT_DIR/.env.production" ]; then
        echo "⚠️  检测到旧版 .env.production，自动重命名为 .env"
        mv "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env"
    else
        echo "❌ 缺少 .env 文件"
        echo "请先执行：cp .env.example .env 并填入生产环境配置"
        exit 1
    fi
fi
echo "✅ .env 配置文件已就绪"

# ---- 1. 检查备份文件是否存在 ----
echo ""
echo "[1/7] 检查备份文件..."
if [ ! -f "$BACKUP_PG" ]; then
    echo "❌ PostgreSQL 备份文件不存在: $BACKUP_PG"
    echo "请先在 PM2 迁移前运行备份命令："
    echo "  su - postgres -c \"pg_dumpall -U postgres > /tmp/ublog_backup.sql\""
    exit 1
fi
if [ ! -f "$BACKUP_REDIS" ]; then
    echo "⚠️  Redis 备份文件不存在（将跳过 Redis 数据导入）"
    SKIP_REDIS=true
else
    SKIP_REDIS=false
    echo "✅ 备份文件检查通过"
fi

# ---- 2. 确认迁移 ----
echo ""
echo "[2/7] 确认迁移..."
echo "即将执行以下操作："
echo "  - 停止 PM2 服务（u-blog-backend, u-blog-prerender）"
echo "  - 启动 Docker PostgreSQL（空 volume）"
echo "  - 导入 /tmp/ublog_backup.sql 到 Docker PostgreSQL"
if [ "$SKIP_REDIS" = false ]; then
    echo "  - 导入 /tmp/ublog_redis_backup.rdb 到 Docker Redis"
fi
echo "  - 启动其余 Docker 服务"
echo ""
read -p "确认执行迁移？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "已取消迁移"
    exit 0
fi

# ---- 3. 停止 PM2 服务 ----
echo ""
echo "[3/7] 停止 PM2 服务..."
source /root/.nvm/nvm.sh
pm2 stop u-blog-backend u-blog-prerender 2>/dev/null || true
pm2 delete u-blog-backend u-blog-prerender 2>/dev/null || true
echo "✅ PM2 服务已停止"

# ---- 4. 启动 Docker PostgreSQL（临时单独启动） ----
echo ""
echo "[4/7] 启动 Docker PostgreSQL（空 volume）..."
cd "$PROJECT_DIR"
docker compose up -d postgres redis
echo "等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U ublog > /dev/null 2>&1; then
        echo "✅ PostgreSQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL 启动超时"
        exit 1
    fi
    sleep 2
done

# ---- 5. 导入 PostgreSQL 数据 ----
echo ""
echo "[5/7] 导入 PostgreSQL 数据到 Docker..."
docker compose exec -T postgres psql -U ublog -d ublog < "$BACKUP_PG"
echo "✅ PostgreSQL 数据导入完成"

# ---- 6. 导入 Redis 数据（可选）----
if [ "$SKIP_REDIS" = false ]; then
    echo ""
    echo "[6/7] 导入 Redis 数据..."
    docker compose cp "$BACKUP_REDIS" redis:/data/dump.rdb
    docker compose exec -T redis redis-cli SHUTDOWN NOSAVE 2>/dev/null || true
    sleep 2
    docker compose start redis
    echo "✅ Redis 数据导入完成"
else
    echo ""
    echo "[6/7] 跳过 Redis 数据导入"
fi

# ---- 7. 启动全部服务 ----
echo ""
echo "[7/7] 启动全部 Docker 服务..."
docker compose up -d
echo "等待所有服务就绪..."
for i in $(seq 1 60); do
    if docker compose exec -T backend wget -qO- http://localhost:3000/registration-status > /dev/null 2>&1; then
        echo "✅ Backend 已就绪"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "⚠️ Backend 启动超时，请检查日志：docker compose logs backend"
    fi
    sleep 3
done

echo ""
echo "=========================================="
echo "迁移完成！"
echo "=========================================="
echo ""
docker compose ps
echo ""
echo "验证访问："
echo "  前台: curl http://localhost/api/registration-status"
echo "  日志: docker compose logs -f"
echo ""
echo "确认无问题后，可清理宿主机旧服务："
echo "  systemctl stop postgresql && systemctl disable postgresql"
echo "  systemctl stop redis && systemctl disable redis"
echo "  rm -rf /var/lib/pgsql /var/lib/redis"
