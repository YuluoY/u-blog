import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

export interface IFollower extends IBaseSchema, Pick<IBaseFields, 'id'> {
  followerId: number
  follower?: IUser
  followingId: number
  following?: IUser
}

/**
 * 前 --> 后
 */
export interface IFollowerDto extends Omit<IFollower, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface IFollowerVo extends Omit<IFollower, 'deletedAt'> {}