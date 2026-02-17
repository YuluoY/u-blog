import { restQuery, restDel } from '../../shared/api/rest'

export interface CommentItem {
  id: number
  content: string
  path: string
  articleId?: number | null
  userId?: number | null
  pid?: number | null
  ip?: string | null
  ipLocation?: string | null
  createdAt?: string
  article?: { id: number; title: string } | null
  user?: { id: number; username: string; namec?: string | null } | null
  parent?: { id: number; user?: { username: string; namec?: string | null } | null } | null
}

const MODEL = 'comment'

const COMMENT_RELATIONS = ['article', 'user', 'parent', 'parent.user'] as const

export async function queryComments(params: { take?: number; skip?: number } = {}) {
  return restQuery<CommentItem[]>(MODEL, {
    take: params.take ?? 50,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
    relations: [...COMMENT_RELATIONS],
  })
}

export async function deleteComment(id: number) {
  return restDel(MODEL, id)
}
