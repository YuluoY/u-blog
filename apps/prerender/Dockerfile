# =====================================================================
# u-blog Prerender Dockerfile
# 使用 Puppeteer 自带 Chromium（无需系统安装浏览器）
# =====================================================================

FROM node:20.19-slim

WORKDIR /app

# 安装 Puppeteer 需要的系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# 设置 Chromium 可执行文件路径
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_ARGS='--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage'

# 复制服务代码（构建上下文为 apps/prerender，文件直接在该目录下）
COPY . .

RUN npm install --omit=dev 2>/dev/null || npm install

EXPOSE 3010

CMD ["node", "server.js"]
