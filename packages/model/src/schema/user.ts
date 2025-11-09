import type { IBaseFields, IBaseSchema } from '../base'
import type { UserRole } from './role'

export interface IUserWebsite {
  url: string
  title: string
  desc: string
  avatar: string
}

export interface IUserSocial {
  name: string
  icon: string
  url: string
}

export interface IUser extends IBaseSchema, Pick<IBaseFields, 'id'> {
  username: string
  password: string
  email: string
  namec?: string
  avatar?: string
  bio?: string
  role: UserRole
  location?: string
  ip?: string
  website?: IUserWebsite
  socials?: IUserSocial[]
  isActive: boolean
  token?: string
  rthash?: string
  failLoginCount: number
  lockoutExpiresAt?: Date | null
  lastLoginAt: Date
}

type SensitiveFields = 'deletedAt' | 'password' | 'rthash' | 'failLoginCount' | 'lockoutExpiresAt' | 'lastLoginAt'

/**
 * 前 --> 后
 */
export interface IUserLoginDto extends Pick<IUser, 'username' | 'password'> {}

export interface IUserRegisterDto extends Omit<
  IUser, 
  keyof IBaseFields | 'deletedAt' | 'token' | 'rthash' | 'failLoginCount' | 'lockoutExpiresAt' | 'lastLoginAt' |
  'ip' | 'location'
> {}

/**
 * 前 <-- 后
 */
export interface IUserVo extends Omit<IUser, SensitiveFields> {}

export interface IUserRegister {
  id: number
  token: string
  rt: string
}

export interface IUserLogin extends Omit<IUser & IUserRegister, SensitiveFields> {}