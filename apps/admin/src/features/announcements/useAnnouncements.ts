import { useQuery } from '@tanstack/react-query'
import { queryAnnouncements } from './api'

export const announcementsQueryKey = ['announcements'] as const

/** 查询公告列表 */
export function useAnnouncements() {
  return useQuery({
    queryKey: [...announcementsQueryKey],
    queryFn: () => queryAnnouncements(),
  })
}
