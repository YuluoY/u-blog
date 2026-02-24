import { restQuery, restDel } from '../../shared/api/rest'

/** 浏览记录项（含关联用户、文章、路由信息） */
export interface ViewItem {
  id: number
  ip?: string | null
  agent?: string | null
  address?: string | null
  userId?: number | null
  articleId?: number | null
  routeId?: number | null
  createdAt?: string
  updatedAt?: string
  user?: { id: number; username: string; namec?: string | null } | null
  article?: { id: number; title: string } | null
  route?: { id: number; page: string } | null
}

const MODEL = 'view'

/** 查询所需的关联关系 */
const VIEW_RELATIONS = ['user', 'article', 'route'] as const

/** 查询浏览记录列表 */
export async function queryViews(params: { take?: number; skip?: number } = {}) {
  return restQuery<ViewItem[]>(MODEL, {
    take: params.take ?? 200,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
    relations: [...VIEW_RELATIONS],
  })
}

/** 删除浏览记录 */
export async function deleteView(id: number) {
  return restDel(MODEL, id)
}
