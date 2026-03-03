# 页面浏览日志去重（一次访问一条）

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - apps/frontend/src/composables/useActivityTracker.ts
- Owner: Frontend

## 功能目的
修复页面浏览埋点重复写入问题，确保“同一次页面访问”只生成一条 `page_view` 行为日志，降低日志噪音并提升统计可解释性。

## 使用方式 / 入口
- 入口：前台应用根组件 `App.vue` 中调用 `useActivityTracker()`。
- 页面浏览上报策略（更新后）：
  1. 进入页面时仅开始计时，不立即写日志；
  2. 离开当前页面时写入一条 `page_view`（包含 `duration`）；
  3. `visibilitychange` 仅触发缓冲区刷新，不再切断当前访问会话。

## 关键约束与边界
- 最小时长阈值：`MIN_PAGE_VIEW_DURATION = 500ms`。
  - 小于阈值的瞬时页面（如重定向中间态）不会写入 `page_view`。
- 同路径重复开始保护：若当前已在同一路径计时，则忽略重复 `start`（避免初始导航与可见性恢复重复触发）。
- 关闭页面时仍通过 `beforeunload + keepalive` 尽量保证最终日志发送。

## Changelog
- 2026-03-03 **Fix**: `page_view` 由“进入+离开双记录”调整为“离开时单记录（含 duration）”，修复同次访问重复日志。
- 2026-03-03 **Fix**: `visibilitychange` 不再在隐藏时结束页面计时，避免切页内重复切分访问会话。
- 2026-03-03 **Fix**: 新增同路径重复 `start` 防护，抑制初始化与可见性恢复导致的重复上报。
- 2026-03-03 **Doc**: 新增 analytics 领域文档记录页面浏览去重策略。
