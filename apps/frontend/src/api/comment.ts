import { type IComment, createComment, toCopy } from '@u-blog/model'
import type { ApiMethod } from './types'

export interface ICommentApis {
  [keyof: string]: ApiMethod
  getCommentList: () => Promise<IComment[]>
}

const apis: ICommentApis = {
  getCommentList()
  {
    return Promise.resolve(
      toCopy(createComment, { min: 10, max: 20 })
    )
  }
}

export default apis
