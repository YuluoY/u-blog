# 行为日志分组视图（普通行为 / SEO抓取）

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - apps/admin/src/features/analytics/AnalyticsPage.tsx
- Owner: Admin

## 功能目的
将后台“行为日志明细”中的普通用户行为与 SEO 抓取日志分组展示，降低混看噪音，提升排查效率。

## 使用方式 / 入口
- 页面入口：后台 `/analytics` -> 行为日志明细。
- 分组方式：
  1. `全部行为`：展示全部事件类型；
  2. `SEO 抓取`：自动设置 `type = crawler_visit` 仅查看爬虫采集日志。
- 事件类型下拉仍可二次筛选，支持按类型快速定位。

## 关键约束与边界
- 切换到 `SEO 抓取` 分组时会重置到第一页，并自动应用 `crawler_visit` 类型过滤。
- 切回 `全部行为` 分组时会清空类型过滤，恢复全量行为视图。
- 分组仅影响查询参数，不改变后端数据模型与统计口径。

## Changelog
- 2026-03-03 **Feat**: 行为日志明细新增 `全部行为 / SEO 抓取` 分组 Tab。
- 2026-03-03 **Update**: `SEO 抓取` 分组自动应用 `crawler_visit` 类型过滤。
- 2026-03-03 **Doc**: 新增 analytics 日志分组文档。
