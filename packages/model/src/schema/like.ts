import type { IBaseFields, IBaseSchema } from '../base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface ILike extends IBaseSchema, Pick<IBaseFields, 'id'> {
  userId: number
  user?: IUser

  articleId?: number
  article?: IArticle

  commentId?: number
  comment?: IComment
}

/**
 * 前 --> 后
 */
export interface ILikeDto extends Omit<ILike, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface ILikeVo extends Omit<ILike, 'deletedAt'> {}