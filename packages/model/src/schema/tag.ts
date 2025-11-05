import type { IBaseFields, IBaseSchema } from '../base'
import { IArticle } from './article'
import type { IUser } from './user'

export interface ITag extends IBaseSchema, Pick<IBaseFields, 'id'> {
  name: string
  desc?: string
  color?: string
  userId: number
  user?: IUser
  articles?: IArticle[]
}

/**
 * 前 --> 后
 */
export interface ITagDto extends Omit<ITag, keyof IBaseFields | 'deletedAt' | 'user' | 'articles'> {}

/**
 * 前 <-- 后
 */
export interface ITagVo extends Omit<ITag, 'deletedAt'> {}