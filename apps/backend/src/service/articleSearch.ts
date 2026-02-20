import type { Request } from 'express'
import { getDataSource } from '@/utils'
import { Article } from '@/module/schema/Article'
import { CArticleStatus } from '@u-blog/model'

/** 搜索范围：仅标题 / 仅正文 / 仅描述 / 全部 */
export type SearchScope = 'title' | 'content' | 'desc' | 'all'

export interface ArticleSearchItem {
  id: number
  title: string
  desc: string | null
  publishedAt: string
  /** 命中片段（来自正文或描述），用于列表展示与高亮 */
  snippet: string | null
}

const DEFAULT_LIMIT = 20
const SNIPPET_MAX_LEN = 120
const SNIPPET_CONTEXT = 50

/**
 * 从文本中截取包含关键词的片段（去除部分 Markdown，限制长度）
 */
function extractSnippet(text: string | null | undefined, keyword: string): string | null {
  if (!text || !keyword) return null
  const lower = text.toLowerCase()
  const k = keyword.trim().toLowerCase()
  if (!k) return null
  const idx = lower.indexOf(k)
  if (idx === -1) return null
  const start = Math.max(0, idx - SNIPPET_CONTEXT)
  const end = Math.min(text.length, idx + k.length + SNIPPET_CONTEXT)
  let raw = text.slice(start, end)
  raw = raw.replace(/\s+/g, ' ').replace(/#{1,6}\s?/g, '').replace(/\*\*?|__?/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  if (start > 0) raw = '…' + raw
  if (end < text.length) raw = raw + '…'
  raw = raw.trim()
  return raw.length > SNIPPET_MAX_LEN ? raw.slice(0, SNIPPET_MAX_LEN) + '…' : raw
}

/**
 * 文章全文搜索：对标题、正文、描述进行 ILIKE 匹配，仅返回已发布文章
 * @param req 请求（用于取 DataSource）
 * @param keyword 关键词，会做前后 % 模糊匹配
 * @param scope 搜索范围，默认 all
 * @param limit 返回条数，默认 20
 */
export async function searchArticles(
  req: Request,
  keyword: string,
  scope: SearchScope = 'all',
  limit: number = DEFAULT_LIMIT
): Promise<ArticleSearchItem[]> {
  const k = (keyword ?? '').trim()
  if (!k) return []

  const ds = getDataSource(req)
  const repo = ds.getRepository(Article)
  const pattern = `%${k}%`

  const qb = repo
    .createQueryBuilder('a')
    .select(['a.id', 'a.title', 'a.desc', 'a.content', 'a.publishedAt'])
    .where('a.status = :status', { status: CArticleStatus.PUBLISHED })

  switch (scope) {
    case 'title':
      qb.andWhere('a.title ILIKE :pattern', { pattern })
      break
    case 'content':
      qb.andWhere('a.content ILIKE :pattern', { pattern })
      break
    case 'desc':
      qb.andWhere('a.desc ILIKE :pattern', { pattern })
      break
    default:
      qb.andWhere(
        '(a.title ILIKE :pattern OR a.content ILIKE :pattern OR (a.desc IS NOT NULL AND a.desc ILIKE :pattern))',
        { pattern }
      )
  }

  qb.orderBy('CASE WHEN a.title ILIKE :pattern THEN 0 ELSE 1 END', 'ASC')
  qb.addOrderBy('a.publishedAt', 'DESC')
  qb.take(Math.min(limit, 50))

  const rows = await qb.getMany()

  return rows.map((a) => {
    let snippet: string | null = null
    if (scope === 'content' || scope === 'all') {
      snippet = extractSnippet(a.content, k)
    }
    if (snippet == null && (scope === 'desc' || scope === 'all') && a.desc) {
      snippet = extractSnippet(a.desc, k)
    }
    if (snippet == null && (scope === 'title' || scope === 'all')) {
      if ((a.title ?? '').toLowerCase().includes(k.toLowerCase())) {
        snippet = a.title ?? null
      }
    }
    return {
      id: a.id,
      title: a.title ?? '',
      desc: a.desc ?? null,
      publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : String(a.publishedAt),
      snippet
    }
  })
}
