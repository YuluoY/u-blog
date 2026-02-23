import { useQuery } from '@tanstack/react-query'
import { queryRoles } from './api'

export const rolesQueryKey = ['roles'] as const

export function useRoles(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...rolesQueryKey, params],
    queryFn: () => queryRoles(params),
  })
}
