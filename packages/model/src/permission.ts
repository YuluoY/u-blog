import type { IBaseFields } from './base'

export const CPermission =
{
  MENU: 'menu', // 菜单
  BUTTON: 'button'
} as const

export type Permission = typeof CPermission[keyof typeof CPermission]

export interface IPermission extends IBaseFields {
  name: string
  code: string
  desc: string
  type: Permission
  resource: string
  action: string
}

export interface IPermissionDto extends Omit<IPermission, keyof IBaseFields> {}