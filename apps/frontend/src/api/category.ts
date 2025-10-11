import { type ICategory, createCategory, toCopy } from '@u-blog/model'
import type { ApiMethod } from './types'

export interface ICategoryApis {
  [keyof: string]: ApiMethod
  getCategoryList: () => Promise<ICategory[]>
}

const apis: ICategoryApis = {
  getCategoryList()
  {
    return Promise.resolve(
      toCopy(createCategory, { min: 10, max: 20 })
    )
  }
}

export default apis
