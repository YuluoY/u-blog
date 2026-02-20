import request from './request'
import type { BackendResponse } from './request'

/** 搜索范围：仅标题 / 仅正文 / 仅描述 / 全部 */
export type SearchScope = 'title' | 'content' | 'desc' | 'all'

/** 文章搜索单项（后端 /article-search 返回） */
export interface ArticleSearchItem {
  id: number
  title: string
  desc: string | null
  publishedAt: string
  /** 命中片段，用于列表展示与高亮 */
  snippet: string | null
}

/**
 * 全文搜索文章：对标题、正文、描述在后端做 ILIKE 匹配
 * @param keyword 关键词
 * @param scope 范围，默认 all
 * @param limit 条数，默认 20
 */
export async function getArticleSearch(
  keyword: string,
  scope: SearchScope = 'all',
  limit = 20
): Promise<ArticleSearchItem[]> {
  const k = (keyword ?? '').trim()
  if (!k) return []
  const res = await request.get<BackendResponse<ArticleSearchItem[]>>('/article-search', {
    params: { keyword: k, scope, limit },
  })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '搜索失败')
  }
  return Array.isArray(payload.data) ? payload.data : []
}
