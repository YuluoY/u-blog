import type { IBaseFields } from './base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface ILike extends IBaseFields {
  user: IUser
  article: IArticle
  comment: IComment
}

export interface ILikeDto extends Omit<ILike, keyof IBaseFields> {
  userId: string
  articleId: string
  commentId: string
}