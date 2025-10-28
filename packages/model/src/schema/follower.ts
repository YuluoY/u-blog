import type { IBaseFields } from '../base'
import type { IUser } from './user'

export interface IFollower extends IBaseFields {
  follower: Partial<IUser>
  following: Partial<IUser>
}

export interface IFollowerDto extends Omit<IFollower, keyof IBaseFields> {
  followerId: string
  followingId: string
}