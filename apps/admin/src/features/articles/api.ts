import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'
import { apiClient } from '../../shared/api/client'

export interface ArticleItem {
  id: number
  title: string
  content: string
  desc?: string | null
  cover?: string | null
  status: string
  isPrivate: boolean
  isTop: boolean
  /** 是否原创（true=原创，false=转载） */
  isOriginal: boolean
  /** 密码保护（仅管理员查询时返回） */
  protect?: string | null
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
    take: params.take ?? 9999,
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
    isOriginal?: boolean
    categoryId?: number | null
    publishedAt?: string
  }
) {
  return restUpdate<ArticleItem>(MODEL, id, body)
}

export async function deleteArticle(id: number) {
  return restDel(MODEL, id)
}

/** 导出文章接口返回类型 */
export interface ExportedArticle {
  id: number
  title: string
  content: string
}

/**
 * 批量导出文章
 * @param ids 文章 ID 列表
 * @param format 导出格式 md | html
 */
export async function exportArticles(ids: number[], format: 'md' | 'html' = 'md') {
  const res = await apiClient.post<{ code: number; data: ExportedArticle[]; message: string }>(
    '/export/articles', { ids, format }
  )
  if (res.data.code !== 0) throw new Error(res.data.message || '导出失败')
  return res.data.data
}
