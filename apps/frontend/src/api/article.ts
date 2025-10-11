import { type IArticle, createArticle, toCopy } from '@u-blog/model'
import type { ApiMethod } from './types'

export interface IArticleApis {
  [keyof: string]: ApiMethod
  getArticleList: () => Promise<IArticle[]>
}

const apis: IArticleApis = {
  getArticleList()
  {
    return Promise.resolve(
      toCopy(createArticle, { min: 10, max: 20 })
    )
  }
}

export default apis
