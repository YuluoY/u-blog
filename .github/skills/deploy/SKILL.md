# u-blog 部署 Skill

> 本文档是 AI agent / copilot 执行部署任务的唯一权威参考。所有部署操作必须使用本 skill 脚本，禁止手写 rsync / ssh 命令。

## 服务器信息

| 项目 | 内容 |
| --- | --- |
| SSH | `sshpass -p 'Hyl102700' ssh -o PubkeyAuthentication=no -o StrictHostKeyChecking=no root@118.25.178.227` |
| 部署路径 | `/var/www/u-blog` |
| 域名 | `uluo.cloud` / `www.uluo.cloud` |
| HTTPS 证书 | `/etc/nginx/ssl/uluo.cloud/` |
| 进程管理 | PM2（ecosystem.config.js） |
| Web 服务器 | 原生 nginx 1.26（systemd） |
| 数据库 | PostgreSQL 15（systemd，用户 `ublog`，数据库 `ublog`） |
| 缓存 | Redis 7（systemd，127.0.0.1:6379） |
| 操作系统 | OpenCloudOS 9.4 |
| Node.js | v20（`/usr/local/lib/nodejs/node-v20/bin`） |

## 架构概览

```text
                  ┌─────────────┐
                  │   nginx     │
                  │ (:80/:443)  │  systemd
                  └──────┬──────┘
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌───────────┐   ┌───────────┐   ┌────────────┐
  │ frontend  │   │   admin   │   │  backend   │
  │ (静态文件) │   │ (静态文件) │   │  (:3000)   │  PM2
  │ dist/     │   │ dist/     │   │  Node.js   │
  └───────────┘   └───────────┘   └─────┬──────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼                           ▼
                   ┌───────────┐               ┌───────────┐
                   │ PostgreSQL│               │   Redis   │
                   │  (15)     │  systemd      │   (7)     │  systemd
                   └───────────┘               └───────────┘
```

- nginx 直接 serve 前端 / 管理台静态文件，反代 `/api` 到 backend :3000。
- 前端、管理台构建产物位于 `apps/frontend/dist/`、`apps/admin/dist/`。
- 后端通过 `pnpm deploy --legacy` 生成独立部署包（含完整 node_modules）。
- PostgreSQL、Redis 数据由 systemd 管理的原生服务持久化。

## 首次部署

先在服务器准备基础环境，再回到本地执行部署脚本。

### 1. 服务器环境准备

```bash
# 安装 Node.js v20、pnpm、pm2
# 安装原生 PostgreSQL 15、Redis 7、nginx
# 创建数据库用户与数据库
su - postgres -c "psql -c \"CREATE USER ublog WITH PASSWORD '<password>';\" && psql -c \"CREATE DATABASE ublog OWNER ublog;\""

# 准备项目目录与 .env
mkdir -p /var/www/u-blog
# 在 /var/www/u-blog/.env 中填入生产配置
# 创建 .env 符号链接（dotenv 在 apps/backend/ 下查找 .env）
ln -s /var/www/u-blog/.env /var/www/u-blog/apps/backend/.env
```

### 2. 本地执行部署

```bash
cd /Users/huyongle/Desktop/Projects/u-blog
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:package
```

该脚本会自动完成：
1. 本地构建共享包 → 前端 → 管理台
2. 本地编译后端 TypeScript
3. 本地 `pnpm deploy --legacy` 生成后端部署包（含完整 node_modules）
4. 修复 `@u-blog/*` workspace 符号链接（替换为真实文件）
5. rsync 后端部署包、前端 dist、管理台 dist 到服务器
6. 在服务器安装 `@img/sharp-linux-x64`（平台相关二进制）
7. rsync 后端 locales（tsc 不复制 yml 文件）
8. PM2 reload 后端进程
9. nginx reload

如需直接调用脚本：

```bash
U_BLOG_DEPLOY_PASSWORD='Hyl102700' \
  node .github/skills/deploy/scripts/deploy-static-artifacts.js
```

## 日常部署（唯一允许的方式）

```bash
cd /Users/huyongle/Desktop/Projects/u-blog
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:package
```

兼容旧命令：

```bash
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:static
```

> `deploy:static` 只是保留兼容别名，实际与 `deploy:package` 相同。

### 按需部署（仅构建/上传指定服务）

```bash
# 仅部署后端（跳过前端/管理台构建，节省大量时间）
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:package -- --only backend

# 仅部署前端
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:package -- --only frontend

# 仅部署后端 + 管理台
U_BLOG_DEPLOY_PASSWORD='Hyl102700' pnpm deploy:package -- --only backend --only admin
```

> `--only` 可重复使用，支持 `backend` / `frontend` / `admin` 三个目标。不指定时默认全部。

## 验证

```bash
# 检查 PM2 进程状态
sshpass -p 'Hyl102700' ssh root@118.25.178.227 'pm2 ls'

# 检查后端日志
sshpass -p 'Hyl102700' ssh root@118.25.178.227 'pm2 logs u-blog-backend --lines 30'

# 检查后端健康状态
curl https://www.uluo.cloud/api/registration-status

# 检查 nginx 状态
sshpass -p 'Hyl102700' ssh root@118.25.178.227 'systemctl status nginx'

# 重载 nginx
sshpass -p 'Hyl102700' ssh root@118.25.178.227 'nginx -s reload'
```

## 服务管理

```bash
# PM2 操作
pm2 ls                          # 查看进程列表
pm2 restart u-blog-backend      # 重启后端
pm2 reload u-blog-backend       # 零停机重载
pm2 logs u-blog-backend         # 实时日志
pm2 monit                       # 监控面板

# systemd 服务
systemctl status nginx          # nginx 状态
systemctl restart nginx         # 重启 nginx
systemctl status postgresql     # PostgreSQL 状态
systemctl status redis          # Redis 状态

# 数据库操作
su - postgres -c "psql -U ublog -d ublog"   # 进入数据库
su - postgres -c "pg_dumpall > /tmp/ublog_backup.sql"  # 全量备份
```

## 注意事项

- `.env` 文件已加入 `.gitignore`，**不会**被 rsync/git 同步到服务器，需在服务器上单独维护。
- `.env` 必须在 `apps/backend/` 下有符号链接指向项目根 `.env`（dotenv 以 cwd 为基准查找）。
- `.env` **必填项**：`DB_PASSWORD`、`JWT_SECRET`、`ENCRYPTION_KEY`、`TRANSPORT_KEY`、`CORS_ORIGIN`、`SITE_URL`。
- `@faker-js/faker` 是 devDependency 但在后端初始化中使用，因此 `pnpm deploy` **不能**加 `--prod` 标志。
- `@img/sharp-linux-x64` 是平台相关二进制，必须在 Linux 服务器上安装（脚本自动处理）。
- `src/locales/*.yml` 不会被 tsc 编译，需要额外 rsync 到 `dist/src/locales/`（脚本自动处理）。
- ecosystem.config.js 使用 `env`（非 `env_production`），PM2 启动时无需 `--env production` 参数。

## 自启动配置

所有服务均已配置开机自启：

```bash
# PM2 自启动（已配置）
pm2 startup systemd    # 生成 systemd service
pm2 save               # 保存当前进程列表

# 系统服务（已启用）
systemctl enable nginx
systemctl enable postgresql
systemctl enable redis
```

## 常见故障处理

### 后端启动失败 — MODULE_NOT_FOUND

**可能原因**：
1. `pnpm deploy` 生成的 `@u-blog/*` 符号链接指向本地 Mac 路径
2. sharp 缺少 Linux 平台二进制
3. locales 目录缺失

**修复**：重新执行 `pnpm deploy:package`，脚本会自动修复上述问题。手动排查：

```bash
# 检查 @u-blog 包是否为有效目录
ls -la /var/www/u-blog/apps/backend/node_modules/@u-blog/

# 检查 sharp 绑定
ls /var/www/u-blog/apps/backend/node_modules/.pnpm/sharp@*/node_modules/@img/

# 检查 locales
ls /var/www/u-blog/apps/backend/dist/src/locales/
```

### PostgreSQL 连接失败

**常见原因**：
1. `listen_addresses` 未包含 `127.0.0.1`（默认只听 IPv6 `::1`）
2. `.env` 中 `DB_PASSWORD` 与数据库实际密码不匹配
3. `.env` 符号链接缺失

**诊断与修复**：
```bash
# 检查 PG 监听
ss -tlnp | grep 5432

# 修改监听地址
# 编辑 /var/lib/pgsql/data/postgresql.conf：listen_addresses = '127.0.0.1,::1'
systemctl restart postgresql

# 同步密码
su - postgres -c "psql -c \"ALTER USER ublog WITH PASSWORD '<password>';\""

# 确认 .env 符号链接
ls -la /var/www/u-blog/apps/backend/.env
```

### PM2 进程 errored 状态

```bash
# 查看错误日志
pm2 logs u-blog-backend --err --lines 50

# 清除日志后重启
pm2 flush u-blog-backend
pm2 restart u-blog-backend

# 若反复崩溃，检查 .env 和 node_modules 完整性
pm2 delete u-blog-backend
cd /var/www/u-blog && pm2 start ecosystem.config.js
```

## Changelog

- `Refactor` 2025-01: 从 Docker Compose 迁移至 nginx + PM2 原生部署架构
