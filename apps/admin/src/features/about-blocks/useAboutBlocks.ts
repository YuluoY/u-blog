import { useQuery } from '@tanstack/react-query'
import { queryAboutBlocks } from './api'

export const aboutBlocksQueryKey = ['aboutBlocks'] as const

export function useAboutBlocks(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...aboutBlocksQueryKey, params],
    queryFn: () => queryAboutBlocks(params),
  })
}
