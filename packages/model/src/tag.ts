import type { IBaseFields } from './base'
import type { IUser } from './user'

export interface ITag extends IBaseFields {
  name: string
  desc: string
  user: IUser
  color: string
}

export interface ITagDto extends ITag {
  userId: string
}