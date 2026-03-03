# 根目录脚本清理说明

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - scripts/dev.js
  - scripts/

## 功能目的
清理根目录 `scripts/` 下未被项目运行入口使用、且属于一次性排障/迁移的历史脚本，降低维护成本与误执行风险。

## 使用方式/入口
- 保留入口：`pnpm dev`（内部执行 `node scripts/dev.js`）
- 其余根目录历史脚本已移除；如需迁移/修复能力，建议在对应 app 内按需重建并纳入 package scripts。

## 关键约束与边界
- 本次仅清理根目录 `scripts/`，不影响 `apps/*/scripts` 与 `packages/*/scripts`。
- 清理标准：无 package scripts 入口引用、无构建流程依赖、明显为一次性任务脚本。

## Changelog
- 2026-03-03 **Refactor**: 清理根目录 `scripts/` 中 14 个历史一次性脚本，仅保留 `dev.js`
- 2026-03-03 **Chore**: 降低误执行风险（包含硬编码连接信息的旧脚本）
- 2026-03-03 **Doc**: 新增脚本清理文档
