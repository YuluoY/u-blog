import { restQuery, restDel } from '../../shared/api/rest'

/** 点赞记录项（含关联用户、文章、评论信息） */
export interface LikeItem {
  id: number
  userId?: number | null
  articleId?: number | null
  commentId?: number | null
  ip?: string | null
  fingerprint?: string | null
  createdAt?: string
  updatedAt?: string
  user?: { id: number; username: string; namec?: string | null } | null
  article?: { id: number; title: string } | null
  comment?: { id: number; content: string } | null
}

const MODEL = 'like'

/** 查询所需的关联关系 */
const LIKE_RELATIONS = ['user', 'article', 'comment'] as const

/** 查询点赞记录列表 */
export async function queryLikes(params: { take?: number; skip?: number } = {}) {
  return restQuery<LikeItem[]>(MODEL, {
    take: params.take ?? 200,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
    relations: [...LIKE_RELATIONS],
  })
}

/** 删除点赞记录 */
export async function deleteLike(id: number) {
  return restDel(MODEL, id)
}
