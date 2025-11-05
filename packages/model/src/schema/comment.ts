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
}

/**
 * 前 --> 后
 */
export interface ICommentDto extends Omit<IComment, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface ICommentVo extends Omit<IComment, 'deletedAt'> {}

