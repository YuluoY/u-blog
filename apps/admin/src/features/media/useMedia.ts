import { useQuery } from '@tanstack/react-query'
import { queryMedia } from './api'

export const mediaQueryKey = ['media'] as const

export function useMedia(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...mediaQueryKey, params],
    queryFn: () => queryMedia(params),
  })
}
