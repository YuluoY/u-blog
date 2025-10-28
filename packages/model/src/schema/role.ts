import type { IBaseFields } from '../base'
import type { IPermission } from './permission'

export const CUserRole = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
} as const

export type UserRole = typeof CUserRole[keyof typeof CUserRole]

export interface IRole extends IBaseFields {
  name: UserRole
  desc: string
  permissions: IPermission[]
}

export interface IRoleDto extends Omit<IRole, keyof IBaseFields> {}