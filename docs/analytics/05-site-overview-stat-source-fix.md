# Site Overview 统计口径修正

- Version: 1.0.0
- Last Updated: 2026-03-07
- Code Paths: apps/backend/src/service/common/index.ts, apps/backend/src/controller/rest/index.ts, apps/backend/src/service/cache.ts
- Owner: Backend

## 功能目的
修正前台左侧网站信息面板的统计来源，避免使用文章表中的冗余历史计数字段，导致评论数、点赞数、浏览量等展示失真。

## 使用方式/入口
- 前台入口：`GET /site-overview`
- 展示位置：前台左侧网站信息面板 `SiteInfoPanel`
- 相关写入入口：评论新增/删除、文章点赞、评论点赞、页面访问/文章浏览

## 关键约束与边界
- `articleCount` 与 `lastUpdate` 仅基于已发布文章统计。
- `totalViews` / `totalUniqueVisitors` 优先使用 `ActivityLog` 中的 `page_view` 事件；若无数据，则回退到 `View` 表。
- `totalLikes` 直接统计 `like` 表，包含文章点赞与评论点赞。
- `totalComments` 直接统计 `comment` 表，避免依赖 `article.commentCount` 冗余字段。
- 评论删除时，同步回写文章表的 `commentCount`，避免文章详情等依赖冗余字段的场景持续漂移。
- 分类/标签变更后也会失效 `site-overview` 缓存，保证侧边栏统计及时更新。

## Changelog
- 2026-03-07 **Fix**: 修正网站概览的浏览、点赞、评论统计来源，改为真实交互表聚合。
- 2026-03-07 **Fix**: 补齐评论删除后文章 `commentCount` 回写，防止冗余计数持续偏移。
- 2026-03-07 **Update**: 分类/标签、点赞变更后同步失效网站概览缓存。
