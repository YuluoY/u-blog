import { useQuery } from '@tanstack/react-query'
import { queryArticles } from './api'

export const articlesQueryKey = ['articles'] as const

export function useArticles(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...articlesQueryKey, params],
    queryFn: () => queryArticles(params),
  })
}
