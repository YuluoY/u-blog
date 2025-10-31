import type { IBaseFields } from '../base'
import type { IUser } from './user'

export interface ITag extends IBaseFields {
  name: string
  desc?: string | null
  user?: IUser | null
  color?: string | null
}

export interface ITagDto extends Omit<ITag, keyof IBaseFields> {
  userId?: string | null
}