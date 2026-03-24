# =====================================================================
# u-blog Backend Dockerfile
# 多阶段构建：builder 安装依赖 → runner 运行时最小镜像
# =====================================================================

# ---- Stage 1: Builder (安装全部依赖) ----
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# 复制 workspace 根文件（pnpm 需要 workspace 上下文）
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# 复制 backend + 依赖的 packages
COPY apps/backend/ apps/backend/
COPY packages/model/ packages/model/
COPY packages/types/ packages/types/
COPY packages/utils/ packages/utils/

# 安装依赖（--frozen-lockfile 保证一致性）
RUN pnpm install --no-frozen-lockfile

# 生产构建跳过 DTS 生成（节省内存，运行时不需要类型声明）
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV SKIP_DTS=1
RUN pnpm --filter @u-blog/model run build \
 && pnpm --filter @u-blog/types run build \
 && pnpm --filter @u-blog/utils run build

# ---- Stage 2: Runner (生产运行) ----
FROM node:20-alpine AS runner

# 安装 pnpm（运行时也需要 workspace 解析）
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# bcrypt 需要的原生编译依赖 + 时区数据
RUN apk add --no-cache python3 make g++ tzdata

WORKDIR /app

# 复制 workspace 根文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# 从 builder 复制已构建的 packages
COPY --from=builder /app/packages/ packages/

# 复制 backend 源码
COPY --from=builder /app/apps/backend/ apps/backend/

# 仅安装生产依赖
RUN pnpm install --no-frozen-lockfile --prod=false

# 创建上传目录
RUN mkdir -p /app/apps/backend/public/uploads \
 && mkdir -p /app/apps/backend/public/static

# 设置环境变量
ENV NODE_ENV=production

WORKDIR /app/apps/backend

EXPOSE 3000

# 使用 tsx 直接运行 TypeScript（与开发一致，无需编译步骤）
CMD ["npx", "tsx", "--tsconfig", "tsconfig.json", "src/main.ts"]
