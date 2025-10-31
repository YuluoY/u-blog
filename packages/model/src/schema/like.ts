import type { IBaseFields } from '../base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface ILike extends IBaseFields {
  user: IUser
  article?: IArticle | null
  comment?: IComment | null
}

export interface ILikeDto extends Omit<ILike, keyof IBaseFields> {
  userId: string
  articleId?: string | null
  commentId?: string | null
}