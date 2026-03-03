# SEO抓取监控

- **Version**: 1.0.0
- **Last Updated**: 2026-03-03
- **Code Paths**:
  - `apps/backend/src/router/seo/index.ts`
  - `deploy/prerender/server.js`
  - `apps/admin/src/features/crawler-monitor/`
  - `apps/admin/src/layouts/AdminLayout.tsx`
  - `apps/admin/src/app/router.tsx`

---

## 功能目的

在不恢复主动 SEO 提交的前提下，记录搜索引擎爬虫真实抓取行为，支持后台查看抓取总量、爬虫来源、抓取路径与最近抓取明细。

## 使用方式

### 后端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/seo/crawler/track` | Prerender 上报单次爬虫抓取 |
| GET | `/seo/monitor/crawlers/overview` | 抓取总览（需 admin） |
| GET | `/seo/monitor/crawlers/logs` | 抓取日志分页（需 admin） |

### 管理端页面

- 路由：`/seo-monitor`（兼容旧路径 `/crawler-monitor`）
- 菜单：系统分组下「SEO监控」
- 展示：累计抓取、今日抓取、爬虫种类、已抓取路径、抓取日志表

## 关键约束

- 本能力只做“监控”，不做任何主动推送
- 数据落表复用 `ActivityLog`，事件类型为 `crawler_visit`
- 默认由 Prerender 自动上报，命中缓存 (`HIT`) 与实时渲染 (`MISS`) 都会记录
- 如配置 `CRAWLER_TRACK_KEY`，后端会校验 `x-crawler-track-key`

## Changelog

- `2026-03-03` **Feat**: 新增被动爬虫抓取监控接口与 Admin 页面
- `2026-03-03` **Update**: Prerender 增加抓取上报链路（缓存命中与渲染完成均记录）
- `2026-03-03` **Doc**: 新增爬虫监控文档
- `2026-03-03` **Update**: Admin 后台展示命名统一为 SEO 监控，并将路由主路径调整为 `/seo-monitor`
