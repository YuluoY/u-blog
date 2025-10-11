import { type ITag, createTag, toCopy } from '@u-blog/model'
import type { ApiMethod } from './types'

export interface ITagApis {
  [keyof: string]: ApiMethod
  getTagList: () => Promise<ITag[]>
}

const apis: ITagApis = {
  getTagList()
  {
    return Promise.resolve(
      toCopy(createTag, { min: 10, max: 20 })
    )
  }
}

export default apis
