# u-blog Agent Instructions

本文件是仓库级 AI 协作入口，负责约束所有 agent / copilot / codex 类工具在本仓库中的默认行为。

## 必读顺序

1. `./.github/copilot-instructions.md`
2. `./.github/instructions/core.instructions.md`
3. `./.github/instructions/monorepo.instructions.md`
4. 所有与当前改动路径匹配的 `./.github/instructions/*.instructions.md`
5. 当前任务涉及到的 `./.github/skills/*/SKILL.md`

## 执行原则

- 在开始分析、设计、编码前，必须先读取 `.github/` 下相关 instructions。
- 优先复用现有模块边界、数据流、状态管理、请求封装与目录结构，不要为局部需求引入旁路实现。
- 以仓库真实代码为准；如果 README、docs、instructions 与代码不一致，应同步修正文档，而不是围绕旧文档硬凑实现。
- 统一使用 `pnpm` 作为包管理与脚本入口，不在仓库内混用 `npm` / `yarn` 约定。
- 变更用户可见行为、接口契约、脚本命令、工程流程或 instructions 本身时，必须同步更新对应文档。
- 非平凡公共函数、导出 API 与复杂逻辑需要保留有价值的中文 JSDoc / 注释，解释设计意图、边界与约束。

## 交付要求

- 先找同类实现，再改动，避免写出与现有风格不一致的新范式。
- 变更应尽量小而完整；新增逻辑落地后，要顺手清理与本次需求直接相关的死代码、过期分支和重复实现。
- 按改动范围执行最小但充分的校验，并在结果中明确说明已验证与未验证部分。
- 如果任务只涉及文档 / instructions，也要做一致性自检，确认路径、命令、包名和目录引用真实存在。
