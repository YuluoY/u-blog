import { useQuery } from '@tanstack/react-query'
import { querySettings } from './api'

export const settingsQueryKey = ['settings'] as const

export function useSettings(params: { take?: number; skip?: number } = {}) {
  return useQuery({
    queryKey: [...settingsQueryKey, params],
    queryFn: () => querySettings(params),
  })
}
