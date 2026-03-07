# SEO 收录能力说明

- **Version**: 2.1.1
- **Last Updated**: 2026-03-07
- **Code Paths**:
  - `apps/backend/src/router/seo/index.ts` — 被动收录与 SEO 监控路由
  - `apps/admin/src/features/crawler-monitor/CrawlerMonitorPage.tsx` — SEO 抓取监控页面
  - `deploy/nginx/u-blog.conf` — crawlers → prerender 分流配置
  - `deploy/prerender/server.js` — 预渲染服务

---

## 功能目的

当前 SEO 能力仅保留**被动收录**：通过 `robots.txt`、`sitemap.xml` 与 Prerender 供搜索引擎抓取页面内容，并在后台查看爬虫抓取日志。

## 当前后端 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/seo/sitemap.xml` | 动态 XML Sitemap |
| GET | `/seo/robots.txt` | Robots 协议声明 |
| GET | `/seo/article/:id/meta` | 文章 SEO 元数据（供 prerender/前端） |

## 当前能力边界

- 不再提供后台主动提交、自动提交、推送状态查询等能力；
- 搜索引擎发现内容依赖 `robots + sitemap + prerender`；
- 后台 SEO 页面仅保留抓取日志观测能力。

## 关键约束

- 搜索引擎最终是否收录仍取决于平台策略；
- 系统仅负责提供可抓取入口与预渲染 HTML；
- `SEO 抓取日志` 只用于观测爬虫访问，不代表最终收录结果。

---

## Changelog

- `2026-03-07` **Update**: 移除后台主动 SEO 提交与自动提交通路，恢复为纯被动收录模式
- `2026-03-07` **Doc**: SEO 文档同步回退为被动收录说明
