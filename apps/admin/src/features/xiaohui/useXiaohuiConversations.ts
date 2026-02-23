import { useQuery } from '@tanstack/react-query'
import { queryConversations } from './api'

export const xiaohuiQueryKey = ['xiaohui-conversations'] as const

export function useXiaohuiConversations(params: {
  take?: number
  skip?: number
  status?: string
} = {}) {
  return useQuery({
    queryKey: [...xiaohuiQueryKey, params],
    queryFn: () => queryConversations(params),
    refetchInterval: 30_000,
  })
}
