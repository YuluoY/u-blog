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
RUN pnpm install --no-frozen-lockfile

# 生产构建跳过 DTS 生成（节省内存，运行时不需要类型声明）
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV SKIP_DTS=1
RUN pnpm --filter @u-blog/model run build \
 && pnpm --filter @u-blog/types run build \
 && pnpm --filter @u-blog/utils run build

# 构建 admin（跳过 tsc 类型检查，Docker 构建只需 Vite 打包）
RUN cd apps/admin && ADMIN_BASE_PATH=/admin/ npx vite build

# ---- Stage 2: Nginx 服务 ----
FROM nginx:alpine AS runner

# 复制构建产物到 /usr/share/nginx/html/admin（与 ADMIN_BASE_PATH=/admin/ 对应）
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html/admin

# root 指向 /usr/share/nginx/html，location /admin/ 下做 SPA 回退
# 这样 /admin/assets/xxx.js 能正确映射到 /usr/share/nginx/html/admin/assets/xxx.js
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location /admin/ {\n\
    try_files $uri $uri/ /admin/index.html;\n\
  }\n\
  location = / {\n\
    return 301 /admin/;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
