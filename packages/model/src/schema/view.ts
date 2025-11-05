import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'
import type { IArticle } from './article'
import type { IRoute } from './route'

export interface IView extends IBaseSchema, Pick<IBaseFields, 'id'> {
  ip?: string
  agent?: string
  address?: string
  userId?: number
  user?: IUser
  articleId?: number
  article?: IArticle
  routeId?: number
  route?: IRoute
}

/**
 * 前 --> 后
 */
export interface IViewLoginDto extends Omit<IView, keyof IBaseFields | 'deletedAt' | 'ip' | 'agent' | 'address'> {}

/**
 * 前 <-- 后
 */
export interface IViewVo extends Omit<IView, 'deletedAt'> {}
