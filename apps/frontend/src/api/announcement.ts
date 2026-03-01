import { restQuery } from './request'

/** 公告项结构 */
export interface AnnouncementItem {
  id: number
  title: string
  content?: string | null
  bgColor?: string | null
  textColor?: string | null
  isActive: boolean
  sort: number
  createdAt?: string
}

/**
 * 获取当前生效的公告列表（仅 isActive = true，按 sort DESC, id DESC）
 */
export async function fetchActiveAnnouncements(): Promise<AnnouncementItem[]> {
  return restQuery<AnnouncementItem[]>('announcement', {
    where: { isActive: true },
    order: { sort: 'DESC' } as Record<string, 'ASC' | 'DESC'>,
    take: 10,
  })
}

/**
 * 根据 id 获取单条公告（用于详情页）
 */
export async function fetchAnnouncementById(id: number): Promise<AnnouncementItem | null> {
  const list = await restQuery<AnnouncementItem[]>('announcement', {
    where: { id },
    take: 1,
  })
  return list?.[0] ?? null
}
