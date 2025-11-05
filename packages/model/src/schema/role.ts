import type { IBaseFields, IBaseSchema } from '../base'
import { IPermission } from './permission'

export const CUserRole = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
} as const

export type UserRole = typeof CUserRole[keyof typeof CUserRole]

export interface IRole extends IBaseSchema, Pick<IBaseFields, 'id'> {
  name: string
  desc: string
  permissions?: IPermission[]
}

/**
 * 前 --> 后
 */
export interface IRoleDto extends Omit<IRole, keyof IBaseFields | 'deletedAt' | 'permissions'> {
  permissions?: number[]
}

/**
 * 前 <-- 后
 */
export interface IRoleVo extends Omit<IRole, 'deletedAt'> {}