import { restQueryPaged, restAdd, restUpdate, restDel } from '../../shared/api/rest'
import type { PagedResult } from '../../shared/api/rest'

/** Admin 动态列表项（与后端 Moment 实体对齐） */
export interface MomentItem {
  id: number
  userId: number
  content: string
  images?: string[] | null
  imageLayout?: string | null
  mood?: string | null
  tags?: string[] | null
  weather?: string | null
  visibility: string
  isPinned: boolean
  likeCount: number
  commentCount: number
  createdAt?: string
  updatedAt?: string
  user?: { id: number; username?: string; namec?: string; avatar?: string }
}

const MODEL = 'moment'

/** 分页查询动态列表 */
export async function queryMoments(page = 1, pageSize = 20): Promise<PagedResult<MomentItem>> {
  return restQueryPaged<MomentItem>(MODEL, {
    take: pageSize,
    skip: (page - 1) * pageSize,
    order: { isPinned: 'DESC', createdAt: 'DESC' } as Record<string, 'ASC' | 'DESC'>,
    relations: ['user'],
  })
}

/** 新增动态 */
export async function addMoment(body: Partial<MomentItem>) {
  return restAdd<MomentItem>(MODEL, body as Record<string, unknown>)
}

/** 更新动态 */
export async function updateMoment(id: number, body: Partial<MomentItem>) {
  return restUpdate<MomentItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除动态 */
export async function deleteMoment(id: number) {
  return restDel(MODEL, id)
}
