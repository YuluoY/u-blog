# 标签管理：userId 注入修复 & 随机颜色功能

- **Version**: 1.0.0
- **Last Updated**: 2026-03-16
- **Code Paths**:
  - `apps/backend/src/middleware/RestWriteGuard.ts`
  - `apps/admin/src/features/tags/TagFormModal.tsx`
  - `apps/admin/src/features/tags/TagsPage.tsx`

## 功能目的

1. 修复添加标签时 `userId` 为空导致的数据库 NOT NULL 约束报错
2. 新增标签表单弹出时自动生成随机颜色，支持纯色/渐变色切换，且与已有标签颜色不重复

## 变更详情

### Bug Fix: userId 自动注入

**问题根因**：Tag 实体的 `userId` 字段为 `NOT NULL`，但前端表单不会传递 `userId`，后端 `RestWriteGuard` 对 `OWNERSHIP_MODELS`（article/category/tag/media/friend_link）在 POST /add 时没有自动注入 `userId`。

**修复方案**：在 `RestWriteGuard` 中间件处理 `OWNERSHIP_MODELS` 时，对 POST /add 请求自动注入 `req.body.userId = req.user.id`，所有角色统一注入（包括 admin），放在所有权校验之前。

此修复同时解决了 article、media、friend_link 等同类模型可能存在的相同问题。

### Feature: 随机颜色生成

- 新增标签时，颜色字段默认生成一个随机纯色（HSL 色彩空间，饱和度 55-85%、亮度 45-65%）
- 编辑标签时保留原有颜色
- 颜色选择器旁新增两个按钮：
  - **随机**：在当前模式（纯色/渐变）下重新生成随机颜色
  - **渐变/纯色**：切换颜色模式并同时生成对应模式的随机颜色
- 渐变色使用两个色相差 ≥ 60° 的 HSL 色，随机角度，保证渐变效果明显
- 所有随机生成都会排除已有标签的颜色（最多重试 20 次），尽量避免重复

## 关键约束

- 颜色去重基于字符串精确匹配（case-insensitive），HSL 随机空间足够大，碰撞概率极低
- 用户仍可通过 `react-best-gradient-color-picker` 手动选择任意颜色

## Changelog

- `2026-03-16` **Fix**: 修复 OWNERSHIP_MODELS (tag/article/media/friend_link) 新增时 userId 未注入导致 NOT NULL 约束报错
- `2026-03-16` **Feat**: 标签表单弹出时自动生成随机颜色，支持纯色/渐变色切换，排除已有颜色
