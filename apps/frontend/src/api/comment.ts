import type { IComment } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery } from './request'

export interface ICommentApis {
  [keyof: string]: ApiMethod
  getCommentList: () => Promise<IComment[]>
}

const apis: ICommentApis = {
  async getCommentList() {
    try {
      const list = await restQuery<IComment[]>('comment', { take: 100 })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }
}

export default apis
