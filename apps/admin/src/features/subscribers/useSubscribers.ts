import { useQuery } from '@tanstack/react-query'
import { querySubscribers } from './api'

export const subscribersQueryKey = ['subscribers'] as const

export function useSubscribers(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...subscribersQueryKey, params],
    queryFn: () => querySubscribers(params),
  })
}
