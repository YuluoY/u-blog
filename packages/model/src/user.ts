import type { IBaseFields } from './base'
import type { UserRole } from './role'

export interface IUser extends IBaseFields {
  username: string
  email: string
  namec: string
  avatar: string
  bio: string
  role: UserRole
  location: string
  ip: string
  website: IUserWebsite
  socials: IUserSocial[]
  isActive: boolean
  isVerified: boolean
  token: string
  lastLoginAt: string
}

export interface IUserWebsite {
  url: string
  title: string
  desc: string
  cover: string
}

export interface IUserSocial {
  type: string
  logo: string
  url: string
}

export interface IUserDto extends Omit<IUser, keyof IBaseFields> {}
