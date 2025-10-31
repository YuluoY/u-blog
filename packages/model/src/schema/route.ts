import type { IBaseFields } from '../base'

export interface IRoute extends IBaseFields {
  title?: string | null
  name: string
  path: string
  component?: string | null
  redirect?: string | null
  icon?: string | null
  // isHidden?: boolean // 注意：后端实体中目前没有此字段，如果前端需要可以添加
  isKeepAlive: boolean
  isAffix: boolean
  isExact: boolean
  isProtected: boolean
  isHero: boolean
  isLeftSide: boolean
  isRightSide: boolean
  pid?: string | null
  parent?: IRoute | null
}

export interface IRouteDto extends Omit<IRoute, keyof IBaseFields> {}