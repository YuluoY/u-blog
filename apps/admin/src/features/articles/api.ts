import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

export interface ArticleItem {
  id: number
  title: string
  content: string
  desc?: string | null
  cover?: string | null
  status: string
  isPrivate: boolean
  isTop: boolean
  userId: number
  categoryId?: number | null
  commentCount?: number
  likeCount?: number
  viewCount?: number
  publishedAt: string
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'article'

export async function queryArticles(params: { take?: number; skip?: number } = {}) {
  return restQuery<ArticleItem[]>(MODEL, {
    take: params.take ?? 50,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
  })
}

export async function addArticle(body: {
  title: string
  content: string
  desc?: string
  status?: string
  userId: number
  categoryId?: number
  publishedAt: string
}) {
  return restAdd<ArticleItem>(MODEL, body)
}

export async function updateArticle(
  id: number,
  body: {
    title?: string
    content?: string
    desc?: string
    cover?: string
    status?: string
    isPrivate?: boolean
    isTop?: boolean
    categoryId?: number | null
    publishedAt?: string
  }
) {
  return restUpdate<ArticleItem>(MODEL, id, body)
}

export async function deleteArticle(id: number) {
  return restDel(MODEL, id)
}
