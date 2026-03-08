Version: 1.0.0
Last Updated: 2026-03-08
Code Paths: apps/frontend/src/stores/model/article.ts, apps/frontend/src/views/WriteView.vue, apps/frontend/src/views/ReadView.vue
Owner: 

# 文章更新后阅读页缓存修复

## 功能目的
修复文章在编辑页更新发布后，跳转回阅读页仍显示旧正文和旧元信息的问题。

## 使用方式/入口
- 入口：前台文章编辑页 `/write?edit=<articleId>`。
- 操作：修改正文后点击“更新发布”并确认。
- 结果：更新成功后跳转到阅读页，优先展示最新详情缓存，并同步首页/归档中的同篇文章缓存。

## 关键约束与边界
- 阅读页优先使用 `currentArticle` 详情缓存，避免被首页列表中的精简旧数据覆盖。
- 更新成功后立即重新请求该文章详情，再同步到 `currentArticle`、首页列表和归档列表，避免只更新局部字段。
- 若详情重取失败，仍保留原有更新成功流程，不额外阻断用户跳转。

## Changelog
- 2026-03-08 **Fix**: 修复文章更新发布后阅读页仍命中旧缓存，导致正文未刷新的问题
- 2026-03-08 **Doc**: 新增文章更新缓存修复说明