# 评论点赞功能

- **Version**: 1.0.0
- **Last Updated**: 2025-07-15
- **Code Paths**:
  - `apps/backend/src/module/schema/Comment.ts`
  - `apps/backend/src/service/common/index.ts`
  - `apps/backend/src/controller/common/index.ts`
  - `apps/backend/src/router/common/index.ts`
  - `apps/frontend/src/api/request.ts`
  - `apps/frontend/src/views/ReadView.vue`
  - `apps/frontend/src/views/MessageView.vue`
  - `packages/model/src/schema/comment.ts`
  - `packages/ui/src/components/comment/`

## 功能目的

为评论/留言添加点赞功能，复用现有的 `Likes` 表（原仅支持文章点赞），扩展为同时支持文章和评论点赞。

## 使用方式

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/comment-like` | 切换评论点赞状态，body: `{ commentId, fingerprint? }` |
| GET | `/comment-like-status` | 查询单条评论点赞状态，query: `commentId, fingerprint?` |
| POST | `/comment-like-statuses` | 批量查询评论点赞状态，body: `{ commentIds, fingerprint? }` |

### 前端调用

```typescript
import { toggleCommentLike, getCommentLikeStatuses } from '@/api/request'

// 切换点赞
const { liked, likeCount } = await toggleCommentLike(commentId, fingerprint?)

// 批量查询
const statusMap = await getCommentLikeStatuses([1, 2, 3], fingerprint?)
// => { 1: true, 2: false, 3: true }
```

### UI 组件

`UCommentItem` 新增 `like` 事件，`UCommentItemData` 新增 `likeCount` / `liked` 字段。
点赞按钮始终可见（不限登录状态），游客通过 IP + fingerprint 去重（24 小时窗口）。

## 关键约束

- `Likes` 表通过 `articleId` / `commentId` 互斥 CHECK 约束区分文章与评论点赞
- 游客去重窗口: 24 小时（`LIKE_DEDUP_MS`）
- Comment 实体新增 `likeCount` 列（int, default 0），需数据库同步

## Changelog

- `2025-07-15` **Feat**: 新增评论点赞功能（后端 API + 前端 UI + 视图集成）
