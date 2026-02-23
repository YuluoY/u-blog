import { useQuery } from '@tanstack/react-query'
import { queryRoutes } from './api'

export const routesQueryKey = ['routes'] as const

export function useRoutes(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...routesQueryKey, params],
    queryFn: () => queryRoutes(params),
  })
}
