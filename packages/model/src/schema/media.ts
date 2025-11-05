import type { IBaseFields, IBaseSchema } from '../base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface IMedia extends IBaseSchema, Pick<IBaseFields, 'id'> {
  name: string
  originalName: string
  type: string
  mineType: string
  url: string
  ext: string
  size?: number | null
  hash: string
  thumbnail?: string
  width?: number
  height?: number
  duration?: number
  articleId?: number
  article?: IArticle
  commentId?: number
  comment?: IComment
  userId?: number
  user?: IUser
}

/**
 * 前 --> 后
 */
export interface IMediaDto extends Omit<IMedia, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface IMediaVo extends Omit<IMedia, 'deletedAt'> {}