import { useQuery } from '@tanstack/react-query'
import { queryCategories } from './api'

export const categoriesQueryKey = ['categories'] as const

export function useCategories(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...categoriesQueryKey, params],
    queryFn: () => queryCategories(params),
  })
}
