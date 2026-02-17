import { useQuery } from '@tanstack/react-query'
import { fetchStats } from './api'

const QUERY_KEY = ['dashboard', 'stats'] as const

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchStats,
  })
}
