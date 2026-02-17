import { useQuery } from '@tanstack/react-query'
import { queryTags } from './api'

export const tagsQueryKey = ['tags'] as const

export function useTags(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...tagsQueryKey, params],
    queryFn: () => queryTags(params),
  })
}
