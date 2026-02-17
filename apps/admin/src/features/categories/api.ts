import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

export interface CategoryItem {
  id: number
  name: string
  desc?: string | null
  userId?: number | null
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'category'

export async function queryCategories(params: { take?: number; skip?: number } = {}) {
  return restQuery<CategoryItem[]>(MODEL, {
    take: params.take ?? 100,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

export async function addCategory(body: { name: string; desc?: string }) {
  return restAdd<CategoryItem>(MODEL, body)
}

export async function updateCategory(id: number, body: { name?: string; desc?: string }) {
  return restUpdate<CategoryItem>(MODEL, id, body)
}

export async function deleteCategory(id: number) {
  return restDel(MODEL, id)
}
