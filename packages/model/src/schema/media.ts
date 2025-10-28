import type { IBaseFields } from '../base'
import type { IArticle } from './article'
import type { IComment } from './comment'
import type { IUser } from './user'

export interface IMedia extends IBaseFields {
  name: string
  originalName: string
  type: string
  mineType: string
  url: string
  ext: string
  size: number
  thumbnail: string
  width: number
  height: number
  duration: number
  article?: Partial<IArticle>
  comment?: Partial<IComment>
  user: IUser
}

export interface IMediaDto extends Omit<IMedia, keyof IBaseFields> {
  articleId?: string
  commentId?: string
  userId?: string
}