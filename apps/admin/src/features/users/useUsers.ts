import { useQuery } from '@tanstack/react-query'
import { queryUsers } from './api'

export const usersQueryKey = ['users'] as const

export function useUsers(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...usersQueryKey, params],
    queryFn: () => queryUsers(params),
  })
}
