import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

/** 公告列表项 */
export interface AnnouncementItem {
  id: number
  title: string
  content?: string | null
  bgColor?: string | null
  textColor?: string | null
  isActive: boolean
  sort: number
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'announcement'

/** 查询所有公告 */
export async function queryAnnouncements() {
  return restQuery<AnnouncementItem[]>(MODEL, {
    take: 100,
    skip: 0,
    order: { sort: 'DESC', id: 'DESC' } as Record<string, 'ASC' | 'DESC'>,
  })
}

/** 新增公告 */
export async function addAnnouncement(body: Partial<AnnouncementItem>) {
  return restAdd<AnnouncementItem>(MODEL, body as Record<string, unknown>)
}

/** 更新公告 */
export async function updateAnnouncement(id: number, body: Partial<AnnouncementItem>) {
  return restUpdate<AnnouncementItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除公告 */
export async function deleteAnnouncement(id: number) {
  return restDel(MODEL, id)
}
