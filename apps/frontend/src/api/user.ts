import { type IUser, createUser } from '@u-blog/model'
import type { ApiMethod } from './types'

export interface IUserApis {
  [keyof: string]: ApiMethod
  getUser: () => Promise<IUser>
}

const apis: IUserApis = {
  getUser()
  {
    return Promise.resolve(createUser())
  }
}

export default apis
