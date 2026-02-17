import { restQuery, restDel } from '../../shared/api/rest'

export interface MediaItem {
  id: number
  name: string
  originalName?: string
  type?: string
  url: string
  size?: number | null
  ext?: string
  thumbnail?: string | null
  createdAt?: string
}

const MODEL = 'media'

export async function queryMedia(params: { take?: number; skip?: number } = {}) {
  return restQuery<MediaItem[]>(MODEL, {
    take: params.take ?? 50,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
  })
}

export async function deleteMedia(id: number) {
  return restDel(MODEL, id)
}
