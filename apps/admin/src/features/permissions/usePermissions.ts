import { useQuery } from '@tanstack/react-query'
import { queryPermissions } from './api'

export const permissionsQueryKey = ['permissions'] as const

export function usePermissions(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...permissionsQueryKey, params],
    queryFn: () => queryPermissions(params),
  })
}
