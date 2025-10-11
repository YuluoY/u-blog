import type { IBaseFields } from './base'
import type { IArticle } from './article'
import type { IUser } from './user'

export interface IComment extends IBaseFields {
  article?: IArticle
  user: IUser
  content: string
  pid: string
}

export interface ICommentDto extends Omit<IComment, keyof IBaseFields> {
  articleId: string
  userId: string
}