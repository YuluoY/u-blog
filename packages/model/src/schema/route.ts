import type { IBaseFields } from '../base'

export interface IRoute extends IBaseFields {
  title: string
  name: string
  path: string
  component: string
  redirect: string
  icon: string
  isHidden: boolean
  isKeepAlive: boolean
  isAffix: boolean
  isExact: boolean
  isProtected: boolean
  isHero: boolean
  isLeftSide: boolean
  isRightSide: boolean
  pid: string
}

export interface IRouteDto extends Omit<IRoute, keyof IBaseFields> {}