import type { IComment } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery, restAdd } from './request'

export interface ICommentApis {
  [keyof: string]: ApiMethod
  getCommentList: (path?: string) => Promise<IComment[]>
  addComment: (data: { content: string; path: string; userId: number; pid?: number | null }) => Promise<{ id: number }>
}

const apis: ICommentApis = {
  async getCommentList(path?: string) {
    try {
      const body: Parameters<typeof restQuery>[1] = { take: 200, order: { createdAt: 'DESC' }, relations: ['user'] }
      if (path) body.where = { path }
      const list = await restQuery<IComment[]>('comment', body)
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  },
  async addComment(data) {
    const ret = await restAdd<{ id: number }>('comment', data)
    return ret as { id: number }
  }
}

export default apis
