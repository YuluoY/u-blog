import type { IBaseFields } from '../base'
import type { IUser } from './user'

export interface ICategory extends IBaseFields {
  name: string
  desc?: string | null
  user?: IUser | null
}

export interface ICategoryDto extends Omit<ICategory, keyof IBaseFields> {
  userId?: string | null
}