import type { IArticle } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery } from './request'

/** 每页条数 */
export const PAGE_SIZE = 10

/** 文章列表排序：按卡片展示的发布日倒序（新在前） */
export const ARTICLE_LIST_ORDER = { publishedAt: 'DESC' } as const

export interface IArticleApis {
  [keyof: string]: ApiMethod
  /** 分页查询文章列表 */
  getArticleList: (page?: number, pageSize?: number) => Promise<IArticle[]>
  /** 归档用：按时间倒序拉取全部（或大量）文章 */
  getArticleListForArchive: (take?: number) => Promise<IArticle[]>
  /** 根据 id 查询单篇文章 */
  getArticleById: (id: string) => Promise<IArticle | null>
}

const apis: IArticleApis = {
  async getArticleList(page = 1, pageSize = PAGE_SIZE) {
    try {
      const list = await restQuery<IArticle[]>('article', {
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: ARTICLE_LIST_ORDER,
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
        take,
        skip: 0,
        order: ARTICLE_LIST_ORDER,
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
  }
}

export default apis
