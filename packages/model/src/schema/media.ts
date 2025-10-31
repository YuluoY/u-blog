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
  size?: number | null
  hash: string
  thumbnail?: string | null
  width?: number | null
  height?: number | null
  duration?: number | null
  article?: Partial<IArticle> | null
  comment?: Partial<IComment> | null
  user?: IUser | null
}

export interface IMediaDto extends Omit<IMedia, keyof IBaseFields> {
  articleId?: string | null
  commentId?: string | null
  userId?: string | null
}