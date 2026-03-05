# UTabs 样式修复 & 游客设置缓存

- **Version**: 1.1.0
- **Last Updated**: 2026-03-06
- **Code Paths**:
  - `packages/ui/src/components/tabs/src/Tabs.vue`
  - `apps/frontend/src/plugins/ui.ts`
  - `apps/frontend/src/stores/app.ts`

## 功能目的

1. **UTabs 样式修复**：修复设置面板中 Tabs 组件无样式的问题
2. **游客设置缓存**：游客修改设置 → 仅缓存 localStorage，不发 API；登录用户 → 缓存 + 发 API；加载优先级：数据库 > 缓存

## UTabs 修复

**根因**：`Tabs.vue` 使用 `<style lang="scss" scoped>`，当组件作为 UI 库预编译后被消费时，scoped 样式可能无法正确应用。

**补充根因**：前端按需样式清单中漏引了 `@u-blog/ui/dist/es/components/tabs/style.css`，导致即使组件样式定义正确也不会生效。

**修复**：
1. 移除 `Tabs.vue` 的 `scoped` 属性，避免库消费场景样式失配。
2. 在前端 UI 插件中补充 `tabs` 组件样式按需导入。

## 点赞图标修复

**根因**：评论点赞按钮使用 `fa-solid/fa-regular fa-thumbs-up`，但前端 `FontAwesome library.add(...)` 未注册 `faThumbsUp` 与 `farThumbsUp`。

**修复**：在 `apps/frontend/src/plugins/ui.ts` 中补齐 `faThumbsUp` 与 `farThumbsUp` 的 import 和 `library.add(...)` 注册。

## 游客设置缓存

**根因**：所有 setter（`setTheme`、`setLanguage`、`setVisualStyle` 等）无条件调用 `updateSettings()` API。

**修复**：新增 `_syncToServer()` 辅助函数，内部检查 `useUserStore().isLoggedIn`，仅登录用户同步到服务器。所有 setter 中的 `updateSettings({}).catch()` 替换为 `_syncToServer({})`。

**数据优先级保障**：
- 登录用户打开设置面板 → `loadServerSettings()` → `hydrateAppearance()` 用服务端数据覆盖本地
- 游客打开设置面板 → 服务端返回的是全局默认/公共设置
- 修改后始终写 localStorage，确保游客偏好持久化

## Changelog

- `2025-07-15` **Fix**: UTabs 移除 scoped 修复设置面板 tabs 无样式
- `2025-07-15` **Fix**: 游客修改设置不再发 API 请求，仅缓存 localStorage
- `2026-03-06` **Fix**: 前端按需样式补充 `tabs/style.css`，修复设置面板 Tabs 无样式
- `2026-03-06` **Fix**: 补充 `faThumbsUp`/`farThumbsUp` 图标注册，修复评论点赞 icon 丢失
