import type { IBaseFields } from '../base'
import type { IUser } from './user'
import type { IArticle } from './article'
import type { IRoute } from './route'

export interface IView extends IBaseFields {
  ip?: string | null
  agent?: string | null
  address?: string | null
  user?: IUser | null
  article?: IArticle | null
  route?: IRoute | null
}

export interface IViewDto extends Omit<IView, keyof IBaseFields> {
  userId?: string | null
  articleId?: string | null
  routeId?: string | null
}

