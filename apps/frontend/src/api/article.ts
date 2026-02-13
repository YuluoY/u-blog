import type { IArticle } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery } from './request'

export interface IArticleApis {
  [keyof: string]: ApiMethod
  getArticleList: () => Promise<IArticle[]>
  getArticleById: (id: string) => Promise<IArticle | null>
}

const apis: IArticleApis = {
  async getArticleList() {
    try {
      const list = await restQuery<IArticle[]>('article', {
        take: 100,
        order: { publishedAt: 'DESC' }
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
        take: 1
      })
      const arr = Array.isArray(list) ? list : []
      return arr[0] ?? null
    } catch {
      return null
    }
  }
}

export default apis
