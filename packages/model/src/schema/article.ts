import type { IBaseFields, IBaseSchema } from '@/base'
import type { ICategory } from './category'
import type { IUser } from './user'
import { ITag } from './tag'

export const CArticleStatus =
{
  DRAFT: 'draft',
  PUBLISHED: 'published',
  DELETED: 'deleted'
} as const

export type ArticleStatus = typeof CArticleStatus[keyof typeof CArticleStatus]

/**
 * 数据表实例对象（与表字段一一对应）
 */
export interface IArticle extends IBaseSchema, Pick<IBaseFields, 'id'> {
  user?: IUser
  userId: number
  
  category?: ICategory
  categoryId?: number

  tags?: ITag[]

  title: string
  content: string
  desc?: string
  cover?: string
  status: ArticleStatus
  isPrivate: boolean
  isTop: boolean
  protect?: string
  commentCount: number
  likeCount: number
  viewCount: number
  publishedAt: Date
}

/**
 * 前 --> 后
 */
export interface IArticleDto extends Omit<IArticle, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface IArticleVo extends Omit<IArticle, 'deletedAt'> {}
