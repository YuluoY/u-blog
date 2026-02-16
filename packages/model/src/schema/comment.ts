import type { IBaseFields, IBaseSchema } from '../base'
import type { IArticle } from './article'
import type { IUser } from './user'

export interface IComment extends IBaseSchema, Pick<IBaseFields, 'id'> {
  articleId?: number
  article?: IArticle

  userId: number
  user?: IUser

  content: string
  path: string
  pid?: number
  parent?: IComment

  /** 评论时客户端 IP */
  ip?: string | null
  /** 评论时 User-Agent 原始串 */
  userAgent?: string | null
  /** 评论时使用的浏览器 */
  browser?: string | null
  /** 评论时使用的设备类型 */
  device?: string | null
  /** IP 解析的地名 */
  ipLocation?: string | null
}

/**
 * 前 --> 后
 */
export interface ICommentDto extends Omit<IComment, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface ICommentVo extends Omit<IComment, 'deletedAt'> {}

