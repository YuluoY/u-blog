import { useQuery } from '@tanstack/react-query'
import { queryLikes } from './api'

export const likesQueryKey = ['likes'] as const

/** 获取点赞记录列表 */
export function useLikes(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...likesQueryKey, params],
    queryFn: () => queryLikes(params),
  })
}
