import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

/** 路由项 */
export interface RouteItem {
  id: number
  title?: string | null
  name: string
  path: string
  component?: string | null
  redirect?: string | null
  icon?: string | null
  isKeepAlive: boolean
  isAffix: boolean
  isExact: boolean
  isProtected: boolean
  isHero: boolean
  isLeftSide: boolean
  isRightSide: boolean
  isVisible: boolean
  pid?: number | null
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'route'

/** 查询路由列表 */
export async function queryRoutes(params: { take?: number; skip?: number } = {}) {
  return restQuery<RouteItem[]>(MODEL, {
    take: params.take ?? 200,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

/** 新增路由 */
export async function addRoute(body: Partial<RouteItem>) {
  return restAdd<RouteItem>(MODEL, body as Record<string, unknown>)
}

/** 更新路由 */
export async function updateRoute(id: number, body: Partial<RouteItem>) {
  return restUpdate<RouteItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除路由 */
export async function deleteRoute(id: number) {
  return restDel(MODEL, id)
}
