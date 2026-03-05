# 评论链接高亮

- **Version**: 1.1.0
- **Last Updated**: 2025-07-15
- **Code Paths**:
  - `packages/ui/src/components/comment/src/CommentItem.vue`
  - `packages/ui/src/components/comment/styles/index.scss`

## 功能目的

评论内容中如果包含可访问的 URL（http/https），自动高亮为可点击链接，点击后在新窗口打开。
支持纯文本模式和 Markdown 渲染模式。

## 使用方式

无需额外配置，`UCommentItem` 自动检测并高亮链接：
- **纯文本模式**（`plainContent=true`）：通过 `linkifiedPlainText` 计算属性，正则检测 URL 并替换为 `<a>` 标签
- **Markdown 渲染模式**（默认）：`marked` 解析后经 `DOMPurify` 消毒，再后处理为所有 `<a>` 标签注入 `target="_blank"`、`rel="noopener noreferrer"` 和 `class="u-comment-item__link"`

## 关键约束

- 纯文本模式：正则 `/(https?:\/\/[^\s<>"'()\[\]]+)/gi` 匹配 URL，先转义 HTML 实体防 XSS
- Markdown 模式：`DOMPurify.sanitize` 后字符串替换注入链接属性和样式类
- 链接统一 `target="_blank" rel="noopener noreferrer"` 安全属性
- 样式类 `.u-comment-item__link`：主题色高亮、hover 下划线
- SCSS 中不再使用 `:deep()` 选择器（外部非 scoped 样式文件中无效），改为普通嵌套选择器

## Changelog

- `2025-07-15` **Feat**: 评论纯文本模式下自动识别并高亮 URL 链接
- `2025-07-15` **Fix**: 修复 Markdown 渲染模式下链接无高亮样式和 `target="_blank"` 的问题
- `2025-07-15` **Fix**: 移除 SCSS 中无效的 `:deep()` 选择器，改为普通嵌套选择器
