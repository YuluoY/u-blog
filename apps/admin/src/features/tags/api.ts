import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

export interface TagItem {
  id: number
  name: string
  desc?: string | null
  color?: string | null
  userId?: number | null
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'tag'

export async function queryTags(params: { take?: number; skip?: number } = {}) {
  return restQuery<TagItem[]>(MODEL, {
    take: params.take ?? 100,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

export async function addTag(body: { name: string; desc?: string; color?: string }) {
  return restAdd<TagItem>(MODEL, body)
}

export async function updateTag(id: number, body: { name?: string; desc?: string; color?: string }) {
  return restUpdate<TagItem>(MODEL, id, body)
}

export async function deleteTag(id: number) {
  return restDel(MODEL, id)
}
