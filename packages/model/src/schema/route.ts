import type { IBaseFields, IBaseSchema } from '../base'
import type { ISetting } from './setting'

export interface IRoute extends IBaseSchema, Pick<IBaseFields, 'id'> {
  title?: string
  name: string
  path: string
  component?: string
  redirect?: string
  icon?: string
  isKeepAlive: boolean
  isAffix: boolean
  isExact: boolean
  isProtected: boolean
  isHero: boolean
  isLeftSide: boolean
  isRightSide: boolean
  pid?: number
  parent?: IRoute
  settings?: ISetting[]
}

/**
 * 前 --> 后
 */
export interface IRouteDto extends Omit<IRoute, keyof IBaseFields | 'deletedAt' | 'parent'> {}

/**
 * 前 <-- 后
 */
export interface IRouteVo extends Omit<IRoute, 'deletedAt'> {}