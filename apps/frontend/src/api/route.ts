import request from './request'
import type { BackendResponse } from './request'

/** 后端返回的路由可见性信息 */
export interface RouteVisibility {
  name: string
  isVisible: boolean
}

/**
 * 获取所有路由的可见性配置
 * 通过通用 REST 接口查询 route 表，只取 name + isVisible 两个字段
 */
export async function fetchRouteVisibility(): Promise<RouteVisibility[]> {
  const res = await request.post<BackendResponse<RouteVisibility[]>>('/rest/route/query', {
    select: ['name', 'isVisible'],
    take: 200,
  })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '获取路由配置失败')
  }
  return payload.data ?? []
}
