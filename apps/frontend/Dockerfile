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
RUN pnpm install --no-frozen-lockfile

# 生产构建跳过 DTS 生成（节省内存，运行时不需要类型声明）
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV SKIP_DTS=1
RUN pnpm --filter @u-blog/model run build \
 && pnpm --filter @u-blog/types run build \
 && pnpm --filter @u-blog/utils run build \
 && pnpm --filter @u-blog/helper run build \
 && pnpm --filter @u-blog/composables run build \
 && pnpm --filter @u-blog/snowfall run build \
 && pnpm --filter @u-blog/ui run build:es \
 && pnpm --filter @u-blog/ui run build:css \
 && pnpm --filter @u-blog/frontend run build:prod

# ---- Stage 2: Nginx 服务 ----
FROM nginx:alpine AS runner

# 复制构建产物到 Nginx 静态目录（root 指向 /usr/share/nginx/html）
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# SPA 路由回退：所有非静态文件请求都返回 index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
