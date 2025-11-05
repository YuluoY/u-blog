import type { IBaseFields, IBaseSchema } from '../base'
import { IRole } from './role'

export const CPermission =
{
  MENU: 'menu', // 菜单
  BUTTON: 'button',
  API: 'api'
} as const

export const CPermissionAction = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const

export type Permission = typeof CPermission[keyof typeof CPermission]
export type PermissionAction = typeof CPermissionAction[keyof typeof CPermissionAction]

export interface IPermission extends IBaseSchema, Pick<IBaseFields, 'id'> {
  name: string
  code: string
  desc?: string | null
  type: Permission
  resource?: string | null
  action: PermissionAction
  roles?: IRole[]
}

/**
 * 前 --> 后
 */
export interface IPermissionDto extends Omit<IPermission, keyof IBaseFields | 'deletedAt' | 'roles'> {
  roles?: number[]
}

/**
 * 前 <-- 后
 */
export interface IPermissionVo extends Omit<IPermission, 'deletedAt'> {}