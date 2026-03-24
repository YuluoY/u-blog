# Prerender 服务

为 Vue 3 SPA 博客提供搜索引擎爬虫动态渲染，返回完整 HTML + SEO 元数据。

## 架构

```
用户/爬虫 → Cloudflare CDN → Nginx (443)
  │
  ├─ 普通用户 → SPA 静态文件 (Vue 3)
  │
  └─ 爬虫 (map $is_crawler) → Prerender (port 3010)
       ├─ Puppeteer 渲染 HTML
       ├─ 文章页自动注入: title / description / OG / JSON-LD / 文章内容
       └─ 文件缓存 24h TTL
```

## 技术栈

- Express 4 + Puppeteer 24 (内置 Chrome for Testing)
- 自建方案，零外部 SaaS 依赖
- PM2 进程管理 (`u-blog-prerender`)

## 服务器路径

```
/var/www/u-blog/prerender/
├── server.js       ← 服务入口 (Express + Puppeteer)
├── package.json
├── node_modules/
└── cache/          ← 文件缓存目录 (MD5 hash key, 24h TTL)
```

## 核心功能

### 1. 爬虫 UA 检测 (Nginx map)

Nginx 通过 `map $http_user_agent $is_crawler` 检测爬虫：
- 国内：百度 / 搜狗 / 360 / 神马 / 头条 / 华为花瓣
- 国际：Google / Bing / Yahoo / Yandex / DuckDuckGo / Apple
- 社交：Facebook / Twitter / LinkedIn / WhatsApp / Telegram
- 工具：Semrush / Ahrefs / MJ12bot

### 2. 文章页内容注入

`md-editor-v3` 的 MdPreview 组件在 headless Chrome 中不渲染。
解决方案：服务端拦截 `/read/:id` URL，直接从后端 API 获取文章数据，注入：

- `<title>` 替换为文章标题
- `<meta description/keywords/author>` 动态设置
- Open Graph 标签 (`og:title/description/image/url`)
- Twitter Card 标签
- JSON-LD 结构化数据 (`Article` schema)
- 隐藏 `<article>` 元素包含 markdown 转 HTML 内容

### 3. 降级策略

Prerender 不可用 (502/503/504) 时，Nginx `@spa_fallback` 降级回 SPA。

## 部署

```bash
# 从项目根目录
cd /Users/huyongle/Desktop/Projects/u-blog

# 同步 prerender 源码
sshpass -p 'Hyl102700' rsync -avz --exclude='node_modules' --exclude='cache' \
  deploy/prerender/ root@118.25.178.227:/var/www/u-blog/prerender/

# 安装依赖
sshpass -p 'Hyl102700' ssh root@118.25.178.227 \
  'cd /var/www/u-blog/prerender && npm install --production'

# 同步 Nginx 配置
sshpass -p 'Hyl102700' rsync -avz \
  deploy/nginx/u-blog.conf root@118.25.178.227:/etc/nginx/conf.d/u-blog.conf

# 重启/重载
sshpass -p 'Hyl102700' ssh root@118.25.178.227 \
  'export NVM_DIR=/root/.nvm && source $NVM_DIR/nvm.sh && pm2 restart u-blog-prerender && nginx -t && nginx -s reload'
```

## 验证

```bash
# 爬虫获得完整 HTML（文章标题 + SEO 元数据 + 内容）
curl -s -A "Baiduspider" "https://uluo.cloud/read/68" | grep -o '<title>[^<]*</title>'
# → <title>从递归组件到 DSL 引擎... - U-Blog</title>

# 普通用户获得 SPA
curl -s -A "Mozilla/5.0" "https://uluo.cloud/read/68" | grep -o '<title>[^<]*</title>'
# → <title>U-Blog</title>
```

## 配置参数 (server.js)

| 参数 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3010 | 服务监听端口 |
| MAX_CONCURRENT | 3 | 最大并发渲染数 |
| CACHE_TTL | 24h | 文件缓存过期时间 |
| PAGE_TIMEOUT | 15000ms | 页面加载超时 |
| BACKEND_URL | http://127.0.0.1:3000 | 后端 API 地址 |

## 常见问题

### 渲染超时
Chrome 二进制位置：`/root/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome`
检查：`ls /root/.cache/puppeteer/chrome/`

### 内存占用
Puppeteer 每个渲染约 100-200MB，并发 3 个约 600MB。
服务器 3.6G RAM，需确保总内存使用不超过 2.5G。

### 缓存清理
```bash
# 清除所有缓存
rm -rf /var/www/u-blog/prerender/cache/*

# 检查缓存占用
du -sh /var/www/u-blog/prerender/cache/
```
