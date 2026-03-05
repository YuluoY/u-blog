# Frontend ESLint 批量修复

- **Version**: 1.0.0
- **Last Updated**: 2026-03-06
- **Code Paths**:
  - `apps/frontend/src/**`
  - `apps/frontend/src/api/chat.ts`
  - `apps/frontend/src/api/xiaohui.ts`
  - `apps/frontend/src/composables/useChatRAG.ts`
  - `apps/frontend/src/views/ReadView.vue`

## 功能目的

修复前端 ESLint 报错，恢复 `pnpm --filter @u-blog/frontend lint` 可通过状态，保证代码风格与规则一致。

## 使用方式/入口

在仓库根目录执行：

- `pnpm --filter @u-blog/frontend lint --fix`
- `pnpm --filter @u-blog/frontend lint`

## 关键约束与边界

- 本次以 ESLint 自动修复为主，并手动修复剩余 4 个不可自动修复问题：
  - `no-constant-condition`（将 `while (true)` 改为 `for (;;)`）
  - `curly`（去除单语句 `for-of` 的多余花括号）
  - `no-useless-escape`（修正正则字符类转义）
- 仅修复 lint 相关问题，不改变业务逻辑。

## Changelog

- `2026-03-06` **Chore**: 批量执行前端 ESLint 自动修复并清理剩余 4 个手动错误
- `2026-03-06` **Doc**: 新增前端 ESLint 修复记录文档
