# 行为事件全链路排查与词表修复

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - apps/frontend/src/composables/useActivityTracker.ts
  - apps/frontend/src/views/ReadView.vue
  - apps/frontend/src/views/LoginView.vue
  - apps/frontend/src/components/AppShell/SearchPanel.vue
  - apps/backend/src/router/seo/index.ts
  - deploy/prerender/server.js
  - apps/admin/src/features/analytics/AnalyticsPage.tsx
- Owner: Frontend / Admin / Backend

## 功能目的
对“所有会写入行为日志的数据触发点”做一致性排查，降低重复日志风险，并修复事件类型词表与后台筛选不一致问题。

## 使用方式 / 入口
- 前台埋点入口：`useActivityTracker()`（App 根组件注入）。
- 后台行为日志入口：`/analytics` 页面「行为日志明细」。
- SEO 抓取监控入口：`/seo-monitor`（`crawler_visit` 专用视图）。

## 关键约束与边界
- 前端埋点去重：新增 1.5s 短窗口重复事件抑制（相同 type/path/referer/duration/metadata 的事件在窗口内只记一次）。
- 页面浏览 `page_view`：仍采用“离开时单条写入（含 duration）”。
- `crawler_visit` 来源：后端 `/seo/crawler/track`（由 prerender 上报），不走前端 `useActivityTracker`。
- 管理台事件类型词表：补齐 `crawler_visit` 中文映射为“爬虫访问”，并在下拉可筛选。
- 未定义事件类型：统一显示为 `未定义事件（type）`，避免直接裸英文代码。

## 排查结论（触发点清单）
- `page_view`：`useActivityTracker` 路由切换/卸载逻辑。
- `article_view / article_like / comment`：`ReadView`。
- `login / register`：`LoginView`。
- `search`：`SearchPanel`。
- `logout`：`HeadNav`。
- `crawler_visit`：`prerender/server.js` -> `POST /seo/crawler/track`。

## Changelog
- 2026-03-03 **Fix**: 前端埋点新增全事件短窗口去重，覆盖所有手动行为事件触发点。
- 2026-03-03 **Fix**: 管理台行为日志类型词表新增 `crawler_visit`，并加入下拉筛选。
- 2026-03-03 **Update**: 管理台未知事件类型改为中文兜底格式 `未定义事件（type）`。
- 2026-03-03 **Doc**: 新增全链路排查文档与触发点清单。
