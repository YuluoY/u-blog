# 小惠接口 IP 风控与黑名单管理

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - apps/backend/src/router/xiaohui/index.ts
  - apps/admin/src/features/xiaohui/XiaohuiPage.tsx
  - apps/admin/src/features/xiaohui/api.ts
  - apps/admin/src/features/xiaohui/useXiaohuiIpGuard.ts
- Owner: Platform

## 功能目的
针对游客高频刷小惠接口场景，提供突发请求识别、自动封禁、手动封禁、后台解封的闭环治理能力。

## 使用方式 / 入口
- 后端自动风控入口：`POST /xiaohui/chat`
  - 规则：同一 IP 在 5 秒窗口内请求次数 `>= 3` 视为恶意。
  - 命中后返回封禁状态，并在封禁窗口内拒绝请求。
- 后端管理接口（管理员）：
  - `GET /xiaohui/ip-guard/list`：查看当前封禁列表
  - `POST /xiaohui/ip-guard/ban`：手动封禁指定 IP
  - `POST /xiaohui/ip-guard/unban`：解除指定 IP 封禁
- 管理端页面入口：
  - 后台「小惠管理」页面中的“IP 黑名单”区域
  - 支持手动拉黑、刷新列表、单条解封

## 关键约束与边界
- 当前封禁状态与请求窗口为进程内内存态，服务重启后会清空。
- 适用于单实例或会话一致路由场景；多实例需切换为共享存储（如 Redis）以避免节点不一致。
- 自动封禁为短期策略，避免误伤时可由后台快速解封。

## Changelog
- 2026-03-03 **Feat**: 新增小惠接口 5 秒窗口（>=3 次）恶意判定与自动封禁能力
- 2026-03-03 **Feat**: 新增管理员 IP 黑名单列表、手动封禁、解封接口与后台管理页面操作区
- 2026-03-03 **Doc**: 新增小惠风控能力说明文档
