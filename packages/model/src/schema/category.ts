import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

export interface ICategory extends IBaseSchema, Pick<IBaseFields, 'id'> {
  name: string
  desc?: string | null
  user?: IUser | null
  userId?: number | null
}

/**
 * 前 --> 后
 */
export interface ICategoryDto extends Omit<ICategory, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface ICategoryVo extends Omit<ICategory, 'deletedAt'> {}