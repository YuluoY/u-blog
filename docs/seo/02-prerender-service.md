# Prerender 动态渲染服务

- **Version**: 1.1.0
- **Last Updated**: 2026-03-18
- **Code Paths**:
  - `deploy/prerender/server.js` — Prerender 服务入口 (Express + Puppeteer)
  - `deploy/prerender/package.json` — 依赖声明
  - `deploy/nginx/u-blog.conf` — Nginx 爬虫分流 + Prerender 代理配置
- **Owner**: —

---

## 功能目的

Vue 3 SPA 博客（uluo.cloud）在搜索引擎爬虫直接抓取时只能看到空的 `<div id="app"></div>`，导致无法被收录。Prerender 服务通过 Puppeteer 渲染完整 HTML，并注入 SEO 元数据（title / description / OG / JSON-LD / 文章内容），使爬虫能够索引完整页面内容。

在 `2026-03-18` 的修复中，Prerender 额外补上了两类 SEO 稳定性能力：

- **属性安全转义**：文章标题/描述中的引号、特殊字符会被正确转义，避免生成损坏的 `meta` / `og:*` 标签；
- **最近文章直链索引**：在 `/`、`/home`、`/archive` 与 `/read/:id` 的 prerender HTML 中补充一组最近公开文章直链，降低国内爬虫只抓入口页时无法继续发现文章 URL 的风险。

## 使用方式

### 请求链路

```
爬虫 → Cloudflare CDN → Nginx (443)
  → map $is_crawler 检测 UA
  → rewrite /prerender-proxy (internal)
  → proxy_pass http://127.0.0.1:3010/render?url=...
  → Puppeteer 渲染 + 文章内容/最近文章直链注入
  → 返回完整 HTML
```

### API 端点 (Prerender 服务)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/render?url=<target_url>` | 渲染指定 URL 并返回完整 HTML |
| GET | `/health` | 健康检查 |

### 覆盖的爬虫 UA

| 分类 | UA 关键字 |
|------|----------|
| 国内搜索 | Baiduspider, Sogou, 360Spider, HaoSouSpider, YisouSpider, Bytespider, Toutiaospider, PetalBot, Qihoobot, jikeSpider |
| 国际搜索 | Googlebot, bingbot, msnbot, bingpreview, Slurp, DuckDuckBot, YandexBot, Applebot, ia_archiver |
| 社交平台 | facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp, TelegramBot |
| SEO 工具 | SemrushBot, AhrefsBot, MJ12bot |

### 验证命令

```bash
# 爬虫 → 完整 HTML（含文章标题）
curl -s -A "Baiduspider" "https://uluo.cloud/read/68" | grep -o '<title>[^<]*</title>'

# 普通用户 → SPA 默认 title
curl -s -A "Mozilla/5.0" "https://uluo.cloud/read/68" | grep -o '<title>[^<]*</title>'

# SEO 路由
curl -s "https://uluo.cloud/robots.txt" | head -5
curl -s "https://uluo.cloud/sitemap.xml" | head -10
```

## 关键约束与边界

### 性能约束
- 服务器 3.6G RAM，最大并发渲染 3 个 (MAX_CONCURRENT=3)
- 超过并发限制返回 503（Nginx 通过 `@spa_fallback` 降级回 SPA）
- 单页渲染耗时约 2-4 秒，文件缓存 24h TTL

### 已知限制
- `md-editor-v3` 的 MdPreview 组件在 headless Chrome 中不渲染（`.md-editor-preview` 元素不出现）
- 解决方案：服务端直接调用后端 API 获取文章内容，将 markdown 转 HTML 注入隐藏 `<article>` 元素
- 简单 markdown 转换器不支持表格等复杂语法，但能覆盖标题/段落/代码块/列表/链接等常用格式

### 直链发现策略
- `/`、`/home`、`/archive`、`/read/:id` 会额外注入最近公开文章直链索引；
- 该索引只复用已公开文章，不引入私密/草稿内容；
- 目标是把 URL 发现从“依赖复杂首页 DOM”收敛成“稳定 anchor 列表”，增强百度/360 这类入口页优先爬虫的深抓概率。

### 服务器配置
- Chrome for Testing: `/root/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome`
- 服务目录: `/var/www/u-blog/prerender/`
- PM2 进程名: `u-blog-prerender` (id: 1)
- 监听端口: 3010

### Nginx 降级策略
Prerender 服务不可用（502/503/504）时，`proxy_intercept_errors` + `error_page` 自动降级到 `@spa_fallback`，返回 SPA 原文件。用户体验不受影响，仅 SEO 效果退化。

## 部署流程

```bash
# 1. 同步 prerender 代码
sshpass -p '***' rsync -avz --exclude='node_modules' --exclude='cache' \
  deploy/prerender/ root@118.25.178.227:/var/www/u-blog/prerender/

# 2. 同步 Nginx 配置
sshpass -p '***' rsync -avz \
  deploy/nginx/u-blog.conf root@118.25.178.227:/etc/nginx/conf.d/u-blog.conf

# 3. 服务器端安装依赖 + 重启
ssh root@118.25.178.227 'cd /var/www/u-blog/prerender && npm install --production'
ssh root@118.25.178.227 '... pm2 restart u-blog-prerender && nginx -t && nginx -s reload'
```

---

## Changelog

- `2026-03-18` **Fix**: 修复 Prerender 输出中 `meta` / `og:*` 属性值未转义引号导致的损坏 HTML
- `2026-03-18` **Feat**: 为 `/`、`/home`、`/archive`、`/read/:id` 注入最近文章直链索引，增强入口页 URL 发现能力
- `2026-03-18` **Update**: 提升缓存版本，避免旧预渲染缓存继续返回历史损坏 HTML
- `2026-03-18` **Doc**: 同步记录 Prerender 的 SEO 稳定性修复
- `2025-07-22` **Feat**: 创建 Prerender 服务，支持 Puppeteer 渲染 + 文章内容注入 + 30+ 爬虫 UA 检测
- `2025-07-22` **Feat**: Nginx 配置集成 map + internal proxy + @spa_fallback 降级策略
- `2025-07-22` **Feat**: 文章页注入 Open Graph / Twitter Card / JSON-LD 结构化数据
- `2025-07-22` **Doc**: 创建初始文档
