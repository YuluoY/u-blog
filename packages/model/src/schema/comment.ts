import type { IBaseFields } from '../base'
import type { IArticle } from './article'
import type { IUser } from './user'

export interface IComment extends IBaseFields {
  article?: IArticle | null
  user: IUser
  content: string
  path: string
  pid?: string | null
  parent?: IComment | null
}

export interface ICommentDto extends Omit<IComment, keyof IBaseFields> {
  articleId?: string | null
  userId: string
  pid?: string | null
}