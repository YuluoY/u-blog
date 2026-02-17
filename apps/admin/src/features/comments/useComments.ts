import { useQuery } from '@tanstack/react-query'
import { queryComments } from './api'

export const commentsQueryKey = ['comments'] as const

export function useComments(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...commentsQueryKey, params],
    queryFn: () => queryComments(params),
  })
}
