import type { IArticle } from '@u-blog/model'
import { CArticleStatus } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery, restAdd, restUpdate } from './request'
import request from './request'

/** 每页条数 */
export const PAGE_SIZE = 10

/** 首页文章排序方式 */
export type HomeSortType = 'date' | 'hot' | 'likes' | 'trending'

/** 首页排序默认值 */
export const HOME_SORT_DEFAULT: HomeSortType = 'date'

/** 文章列表排序：按创建日期倒序（新在前） */
export const ARTICLE_LIST_ORDER = { createdAt: 'DESC' } as const

/**
 * 文章列表查询字段（排除 content 正文，减少传输体积）
 * 只在用户浏览具体文章时才加载 content
 */
const ARTICLE_LIST_FIELDS = [
  'id', 'title', 'desc', 'cover', 'status',
  'isPrivate', 'isTop', 'commentCount', 'likeCount', 'viewCount',
  'publishedAt', 'createdAt', 'updatedAt',
  'userId', 'categoryId',
]

type OrderSpec = Record<string, 'ASC' | 'DESC'>

/** 根据首页排序方式得到 order 对象（置顶优先 + 第二排序键 + createdAt 兜底） */
export function getArticleListOrder(sort: HomeSortType): OrderSpec
{
  const base: OrderSpec = { isTop: 'DESC' }
  switch (sort)
  {
  case 'hot':
    return { ...base, viewCount: 'DESC', createdAt: 'DESC' }
  case 'likes':
    return { ...base, likeCount: 'DESC', createdAt: 'DESC' }
  case 'trending':
    return { ...base, viewCount: 'DESC', likeCount: 'DESC', createdAt: 'DESC' }
  default:
    // 按创建日期排序，新文章始终在最上面
    return { ...base, createdAt: 'DESC' }
  }
}

/** 新建文章入参（与后端 Article 字段对齐） */
export interface ICreateArticlePayload {
  userId: number
  title: string
  content: string
  desc?: string
  status?: string
  publishedAt: string
  categoryId?: number | null
  tags?: number[]
  isPrivate?: boolean
  isTop?: boolean
  cover?: string | null
  /** 密码保护（加密后的密文，空字符串表示取消保护） */
  protect?: string | null
}

export interface IArticleApis {
  [keyof: string]: ApiMethod
  /** 分页查询文章列表（仅已发布；order 置顶优先 + sort 对应排序） */
  getArticleList: (page?: number, pageSize?: number, sort?: HomeSortType, userId?: number) => Promise<IArticle[]>
  /** 归档用：按时间倒序分页拉取文章 */
  getArticleListForArchive: (take?: number, skip?: number, userId?: number) => Promise<IArticle[]>
  /** 根据 id 查询单篇文章 */
  getArticleById: (id: string) => Promise<IArticle | null>
  /** 新建文章（草稿或发布） */
  createArticle: (payload: ICreateArticlePayload) => Promise<IArticle>
  /** 更新文章 */
  updateArticle: (id: number, payload: Partial<ICreateArticlePayload>) => Promise<IArticle>
  /** 验证文章密码保护，成功返回正文 */
  verifyArticleProtect: (id: number, password: string) => Promise<{ content: string } | null>
}

const apis: IArticleApis = {
  async getArticleList(page = 1, pageSize = PAGE_SIZE, sort: HomeSortType = HOME_SORT_DEFAULT, userId?: number)
  {
    try
    {
      const order = getArticleListOrder(sort)
      const where: Record<string, unknown> = { status: CArticleStatus.PUBLISHED, isPrivate: false }
      if (userId) where.userId = userId
      const list = await restQuery<IArticle[]>('article', {
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        order,
        relations: ['category', 'tags', 'user'],
        // 列表页不需要文章正文，减少传输体积
        select: ARTICLE_LIST_FIELDS,
      })
      return Array.isArray(list) ? list : []
    }
    catch
    {
      return []
    }
  },

  async getArticleListForArchive(take = 30, skip = 0, userId?: number)
  {
    try
    {
      const where: Record<string, unknown> = { status: CArticleStatus.PUBLISHED, isPrivate: false }
      if (userId) where.userId = userId
      const list = await restQuery<IArticle[]>('article', {
        where,
        take,
        skip,
        order: getArticleListOrder('date'),
        relations: ['category', 'tags', 'user'],
        // 归档页不需要文章正文，减少传输体积
        select: ARTICLE_LIST_FIELDS,
      })
      return Array.isArray(list) ? list : []
    }
    catch
    {
      return []
    }
  },

  async getArticleById(id: string)
  {
    try
    {
      const list = await restQuery<IArticle[]>('article', {
        where: { id: parseInt(id, 10) },
        take: 1,
        relations: ['category', 'tags', 'user']
      })
      const arr = Array.isArray(list) ? list : []
      return arr[0] ?? null
    }
    catch
    {
      return null
    }
  },

  async createArticle(payload: ICreateArticlePayload)
  {
    const body = {
      ...payload,
      publishedAt: payload.publishedAt,
      isPrivate: payload.isPrivate ?? false,
      isTop: payload.isTop ?? false
    }
    return restAdd<IArticle>('article', body)
  },

  /** 更新已有文章 */
  async updateArticle(id: number, payload: Partial<ICreateArticlePayload>)
  {
    const body: Record<string, unknown> = { ...payload }
    return restUpdate<IArticle>('article', id, body)
  },

  /** 验证文章密码保护 */
  async verifyArticleProtect(id: number, password: string)
  {
    try
    {
      const res = await request.post<{ code: number; data: { content: string } | null; message: string }>(
        '/rest/article/verify-protect',
        { id, password },
      )
      if (res.data.code === 0 && res.data.data)
      
        return res.data.data
      
      return null
    }
    catch
    {
      return null
    }
  },
}

export default apis
