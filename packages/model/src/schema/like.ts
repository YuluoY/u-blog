import type { IBaseFields, IBaseSchema } from '../base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface ILike extends IBaseSchema, Pick<IBaseFields, 'id'> {
  /** 登录用户 ID（游客点赞时为 null） */
  userId?: number | null
  user?: IUser

  articleId?: number
  article?: IArticle

  commentId?: number
  comment?: IComment

  /** 游客点赞时的客户端 IP */
  ip?: string | null
  /** 游客点赞时的浏览器指纹 */
  fingerprint?: string | null
}

/**
 * 前 --> 后
 */
export interface ILikeDto extends Omit<ILike, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface ILikeVo extends Omit<ILike, 'deletedAt'> {}