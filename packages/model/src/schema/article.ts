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
  /** 是否原创（true=原创，false=转载） */
  isOriginal: boolean
  protect?: string
  /** 后端注入：标记文章是否设置了密码保护（前端使用，protect 明文不暴露给前端） */
  isProtected?: boolean
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
