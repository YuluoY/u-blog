import { useQuery } from '@tanstack/react-query'
import { queryFriendLinks } from './api'

export const friendLinksQueryKey = ['friend-links'] as const

export function useFriendLinks(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...friendLinksQueryKey, params],
    queryFn: () => queryFriendLinks(params),
  })
}
