import type { ICategory } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery } from './request'

export interface ICategoryApis {
  [keyof: string]: ApiMethod
  getCategoryList: () => Promise<ICategory[]>
}

const apis: ICategoryApis = {
  async getCategoryList() {
    try {
      const list = await restQuery<ICategory[]>('category', { take: 100 })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }
}

export default apis
