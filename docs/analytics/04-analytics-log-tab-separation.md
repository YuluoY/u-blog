# 行为日志分组视图（用户 / 游客行为 / SEO抓取）

- Version: 1.0.1
- Last Updated: 2026-03-06
- Code Paths:
  - apps/admin/src/features/analytics/AnalyticsPage.tsx
  - apps/admin/src/features/analytics/api.ts
  - apps/backend/src/router/analytics/index.ts
  - apps/backend/src/service/analytics/index.ts
- Owner: Admin

## 功能目的
将后台“行为日志明细”中的用户 / 游客行为与 SEO 抓取日志分组展示，降低混看噪音，提升排查效率。

## 使用方式 / 入口
- 页面入口：后台 `/analytics` -> 行为日志明细。
- 分组方式：
  1. `用户 / 游客行为`：默认打开，自动排除 `crawler_visit`，仅查看真人访问行为；
  2. `SEO 抓取`：自动设置 `type = crawler_visit`，仅查看爬虫采集日志。
- 事件类型下拉会跟随 Tab 联动：
  - 用户 / 游客行为分组不展示 `crawler_visit`；
  - SEO 抓取分组仅展示 `crawler_visit`。

## 关键约束与边界
- 默认进入 `用户 / 游客行为` 分组，避免 SEO 抓取日志干扰日常行为排查。
- 切换到 `SEO 抓取` 分组时会重置到第一页，并自动应用 `type = crawler_visit`。
- 切回 `用户 / 游客行为` 分组时会重置到第一页，并自动应用 `excludeType = crawler_visit`。
- 分组仅影响查询参数，不改变后端数据模型与统计口径。

## Changelog
- 2026-03-03 **Feat**: 行为日志明细新增 `全部行为 / SEO 抓取` 分组 Tab。
- 2026-03-03 **Update**: `SEO 抓取` 分组自动应用 `crawler_visit` 类型过滤。
- 2026-03-03 **Doc**: 新增 analytics 日志分组文档。
- 2026-03-06 **Update**: 分组调整为 `用户 / 游客行为 / SEO 抓取`，默认打开用户 / 游客行为。
- 2026-03-06 **Fix**: 新增 `excludeType` 过滤，避免真人行为视图混入 `crawler_visit` 日志。
