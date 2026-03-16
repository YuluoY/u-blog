# 文章内链接新标签页打开

- **Version**: 1.0.0
- **Last Updated**: 2026-03-15
- **Code Paths**: `apps/frontend/src/main.ts`

## 功能目的

文章正文中的所有 Markdown 链接点击后在浏览器新标签页中打开，避免用户离开当前阅读页面。

## 实现方式

在 `apps/frontend/src/main.ts` 中调用 md-editor-v3 的全局 `config()`，通过 `markdownItConfig` 钩子修改 markdown-it 的 `link_open` 渲染规则，为所有 `<a>` 标签添加：

- `target="_blank"`：新标签页打开
- `rel="noopener noreferrer"`：安全属性，防止新页面通过 `window.opener` 访问原页面

## 影响范围

所有使用 md-editor-v3 的 `MdPreview` / `MdEditor` 组件均生效，包括：

- 文章阅读页（`ReadView.vue` → `usePreviewMd.tsx`）
- `MarkdownPreview.vue` 包装组件（关于页、公告等）

## 关键约束

- 全局配置需在组件挂载前执行（已放在 `main.ts` 顶部）
- 不影响评论区链接（评论使用独立的 `marked` + `DOMPurify` 渲染，已有 `target="_blank"` 处理）

## Changelog

- 2026-03-15 **Feat**: 文章内 Markdown 链接默认在新标签页打开（`target="_blank" rel="noopener noreferrer"`）
