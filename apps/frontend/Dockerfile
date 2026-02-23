# =====================================================================
# u-blog Frontend Dockerfile
# 多阶段构建：builder 编译 SPA → nginx 生产服务
# =====================================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 复制 workspace 根文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# 复制 frontend + 全部 packages 依赖
COPY apps/frontend/ apps/frontend/
COPY packages/ packages/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 按顺序构建 packages → frontend
RUN pnpm --filter @u-blog/model run build \
 && pnpm --filter @u-blog/types run build \
 && pnpm --filter @u-blog/utils run build \
 && pnpm --filter @u-blog/helper run build \
 && pnpm --filter @u-blog/composables run build \
 && pnpm --filter @u-blog/ui run build:es \
 && pnpm --filter @u-blog/frontend run build:prod

# ---- Stage 2: Nginx 服务 ----
FROM nginx:alpine AS runner

# 复制构建产物到 Nginx 静态目录
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html/frontend

# 复制 Nginx 配置
COPY deploy/nginx/frontend.conf /etc/nginx/conf.d/frontend.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
