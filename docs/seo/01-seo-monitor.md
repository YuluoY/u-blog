# SEO 收录能力说明

- **Version**: 2.0.0
- **Last Updated**: 2026-03-03
- **Code Paths**:
  - `apps/backend/src/router/seo/index.ts` — 仅保留被动收录相关路由
  - `deploy/nginx/u-blog.conf` — crawlers → prerender 分流配置
  - `deploy/prerender/server.js` — 预渲染服务

---

## 功能目的

当前 SEO 能力仅保留“被动收录”：通过 `robots.txt`、`sitemap.xml` 与 Prerender 供搜索引擎抓取页面内容。

## 当前后端 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/seo/sitemap.xml` | 动态 XML Sitemap |
| GET | `/seo/robots.txt` | Robots 协议声明 |
| GET | `/seo/article/:id/meta` | 文章 SEO 元数据（供 prerender/前端） |

## 清理结果（2026-03-03）

- 已移除全部主动提交与统计看板能力
- 已移除管理端对应入口与历史实现

## 关键约束

- 不再支持任何“主动 SEO 推送”逻辑
- 搜索引擎收录依赖爬虫抓取（robots + sitemap + prerender）

---

## Changelog

- `2026-03-03` **Update**: 清理全部主动 SEO 提交相关实现与入口
- `2026-03-03` **Refactor**: 精简 `apps/backend/src/router/seo/index.ts`，仅保留被动收录路由
- `2026-03-03` **Doc**: 文档由“SEO 推送监控系统”更新为“SEO 收录能力说明”
