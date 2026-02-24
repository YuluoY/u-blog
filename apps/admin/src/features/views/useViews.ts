import { useQuery } from '@tanstack/react-query'
import { queryViews } from './api'

export const viewsQueryKey = ['views'] as const

/** 获取浏览记录列表 */
export function useViews(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...viewsQueryKey, params],
    queryFn: () => queryViews(params),
  })
}
