import { useQuery } from '@tanstack/react-query'
import { queryMoments } from './api'

export const momentsQueryKey = ['moments'] as const

/** 查询动态列表（分页） */
export function useMoments(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...momentsQueryKey, page, pageSize],
    queryFn: () => queryMoments(page, pageSize),
  })
}
