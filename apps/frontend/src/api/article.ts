import type { IArticle } from '@u-blog/model'
import { CArticleStatus } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery, restAdd } from './request'

/** 每页条数 */
export const PAGE_SIZE = 10

/** 首页文章排序方式 */
export type HomeSortType = 'date' | 'hot' | 'likes' | 'trending'

/** 首页排序默认值 */
export const HOME_SORT_DEFAULT: HomeSortType = 'date'

/** 文章列表排序：按创建日期倒序（新在前） */
export const ARTICLE_LIST_ORDER = { createdAt: 'DESC' } as const

type OrderSpec = Record<string, 'ASC' | 'DESC'>

/** 根据首页排序方式得到 order 对象（置顶优先 + 第二排序键 + createdAt 兜底） */
export function getArticleListOrder(sort: HomeSortType): OrderSpec {
  const base: OrderSpec = { isTop: 'DESC' }
  switch (sort) {
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
}

export interface IArticleApis {
  [keyof: string]: ApiMethod
  /** 分页查询文章列表（仅已发布；order 置顶优先 + sort 对应排序） */
  getArticleList: (page?: number, pageSize?: number, sort?: HomeSortType) => Promise<IArticle[]>
  /** 归档用：按时间倒序拉取全部（或大量）文章 */
  getArticleListForArchive: (take?: number) => Promise<IArticle[]>
  /** 根据 id 查询单篇文章 */
  getArticleById: (id: string) => Promise<IArticle | null>
  /** 新建文章（草稿或发布） */
  createArticle: (payload: ICreateArticlePayload) => Promise<IArticle>
}

const apis: IArticleApis = {
  async getArticleList(page = 1, pageSize = PAGE_SIZE, sort: HomeSortType = HOME_SORT_DEFAULT) {
    try {
      const order = getArticleListOrder(sort)
      const list = await restQuery<IArticle[]>('article', {
        where: { status: CArticleStatus.PUBLISHED },
        take: pageSize,
        skip: (page - 1) * pageSize,
        order,
        relations: ['category', 'tags', 'user']
      })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  },

  async getArticleListForArchive(take = 500) {
    try {
      const list = await restQuery<IArticle[]>('article', {
        where: { status: CArticleStatus.PUBLISHED },
        take,
        skip: 0,
        order: getArticleListOrder('date'),
        relations: ['category', 'tags', 'user']
      })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  },

  async getArticleById(id: string) {
    try {
      const list = await restQuery<IArticle[]>('article', {
        where: { id: parseInt(id, 10) },
        take: 1,
        relations: ['category', 'tags', 'user']
      })
      const arr = Array.isArray(list) ? list : []
      return arr[0] ?? null
    } catch {
      return null
    }
  },

  async createArticle(payload: ICreateArticlePayload) {
    const body = {
      ...payload,
      publishedAt: payload.publishedAt,
      isPrivate: payload.isPrivate ?? false,
      isTop: payload.isTop ?? false
    }
    return restAdd<IArticle>('article', body)
  }
}

export default apis
