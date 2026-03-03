# 文章列表可抓取链接改造

- **Version**: 1.0.0
- **Last Updated**: 2026-03-04
- **Code Paths**:
  - `apps/frontend/src/components/ArticleListStyles/ArticleBase.vue`
  - `apps/frontend/src/components/ArticleListStyles/ArticleCard.vue`
  - `apps/frontend/src/components/ArticleListStyles/ArticleCompact.vue`
  - `apps/frontend/src/components/ArticleListStyles/ArticleWaterfall.vue`

---

## 功能目的

为首页文章列表补充可被爬虫识别的真实文章链接，提升页面内链可发现性，降低仅依赖 JS 点击跳转导致的抓取路径不足问题。

## 使用方式/入口

- 入口页面：`/home` 文章列表
- 入口组件：`ArticleListStyles` 四种样式组件
- 访问行为：文章标题渲染为 `<a href="/read/:id">`，同时保留原有 SPA 跳转交互（点击标题仍走前端路由）

## 关键约束与边界

- 保持现有视觉样式不变（标题样式继承，去掉默认下划线）
- 不改动列表卡片整体点击行为，仅新增标准可抓取链接语义
- 仅改造文章标题区域，避免引入额外交互副作用

## Changelog

- `2026-03-04` **Update**: 四种文章列表样式的标题由纯文本改为可抓取链接（`/read/:id`）
- `2026-03-04` **Refactor**: 保留原有 `emit('jump')` 逻辑，兼容现有 SPA 导航行为
- `2026-03-04` **Doc**: 新增 SEO 文档，记录文章内链可抓取改造
