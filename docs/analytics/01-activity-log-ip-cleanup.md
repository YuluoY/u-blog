# 行为访问日志按 IP 清理

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - apps/backend/src/router/analytics/index.ts
  - apps/backend/src/service/analytics/index.ts
  - apps/admin/src/features/analytics/api.ts
  - apps/admin/src/features/analytics/AnalyticsPage.tsx
- Owner: Admin & Backend

## 功能目的
为后台运营提供“按指定 IP 定向清理行为访问日志”能力，用于日志治理与异常流量清理，不依赖小惠模块。

## 使用方式 / 入口
- 后台页面入口：数据分析页「行为日志明细」区域。
- 操作步骤：
  1. 在“待清理 IP”输入框填写目标 IP；
  2. 点击“按 IP 清理日志”；
  3. 在二次确认弹窗中确认执行。
- 后端接口：`DELETE /activity/logs/by-ip`
  - 鉴权：`requireAuth + adminOnly`
  - 请求体：`{ ip: string }`
  - 响应：`{ code: 0, data: { deleted: number }, message: string }`

## 关键约束与边界
- 仅支持“精确 IP”匹配删除（`ip = :ip`），不做模糊匹配。
- 当 `ip` 为空时接口直接返回错误。
- 清理成功后，后台会刷新 analytics 相关查询数据（总览/趋势/日志列表等）。

## Changelog
- 2026-03-03 **Feat**: 新增管理员按 IP 清理行为访问日志接口 `DELETE /activity/logs/by-ip`。
- 2026-03-03 **Feat**: 后台分析页新增“待清理 IP + 按 IP 清理日志”操作入口（含二次确认）。
- 2026-03-03 **Doc**: 新增 analytics 领域文档，说明用法、接口与边界。
