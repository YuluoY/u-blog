# =====================================================================
# u-blog Admin Dockerfile
# 多阶段构建：builder 编译 SPA → nginx 生产服务
# =====================================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 复制 workspace 根文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# 复制 admin + 依赖的 packages
COPY apps/admin/ apps/admin/
COPY packages/model/ packages/model/
COPY packages/types/ packages/types/
COPY packages/utils/ packages/utils/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建 packages（admin 依赖：model, utils）
RUN pnpm --filter @u-blog/model run build \
 && pnpm --filter @u-blog/types run build \
 && pnpm --filter @u-blog/utils run build

# 构建 admin
RUN pnpm --filter @u-blog/admin run build

# ---- Stage 2: Nginx 服务 ----
FROM nginx:alpine AS runner

# 复制构建产物
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html/admin

# 复制 Nginx 配置
COPY deploy/nginx/admin.conf /etc/nginx/conf.d/admin.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
