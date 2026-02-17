import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

export interface AboutBlockItem {
  id: number
  page: string
  sortOrder: number
  type: string
  title?: string | null
  content: string
  extra?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'page_block'

export async function queryAboutBlocks(params: { take?: number; skip?: number } = {}) {
  return restQuery<AboutBlockItem[]>(MODEL, {
    take: params.take ?? 100,
    skip: params.skip ?? 0,
    order: { sortOrder: 'ASC', id: 'ASC' },
  })
}

export async function addAboutBlock(body: {
  page: string
  sortOrder?: number
  type: string
  title?: string
  content: string
  extra?: Record<string, unknown>
}) {
  return restAdd<AboutBlockItem>(MODEL, body)
}

export async function updateAboutBlock(
  id: number,
  body: { page?: string; sortOrder?: number; type?: string; title?: string; content?: string; extra?: Record<string, unknown> }
) {
  return restUpdate<AboutBlockItem>(MODEL, id, body)
}

export async function deleteAboutBlock(id: number) {
  return restDel(MODEL, id)
}
