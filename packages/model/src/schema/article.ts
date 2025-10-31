import type { IBaseFields } from '@/base'
import type { ICategory } from './category'
import type { ITag } from './tag'
import type { IUser } from './user'

export const CArticleStatus =
{
  DRAFT: 'draft',
  PUBLISHED: 'published',
  DELETED: 'deleted'
} as const

export type ArticleStatus = typeof CArticleStatus[keyof typeof CArticleStatus]

export interface IArticle extends IBaseFields {
  user: IUser
  author: IUser[]
  category?: ICategory | null
  tags: ITag[]
  title: string
  content: string
  desc?: string | null
  cover?: string | null
  status: ArticleStatus
  isPrivate: boolean
  isTop: boolean
  protect?: string | null
  commentCount: number
  likeCount: number
  viewCount: number
  publishedAt?: string | null
}

export interface IArticleDto extends Omit<IArticle, keyof IBaseFields> {
  userId: string
  categoryId?: string | null
  tagIds: string[]
}