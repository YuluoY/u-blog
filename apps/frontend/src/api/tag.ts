import type { ITag } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery } from './request'

export interface ITagApis {
  [keyof: string]: ApiMethod
  getTagList: () => Promise<ITag[]>
}

const apis: ITagApis = {
  async getTagList() {
    try {
      const list = await restQuery<ITag[]>('tag', { take: 100 })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }
}

export default apis
