import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

/**
 * 数据表实例对象（与表字段一一对应）
 */
export interface IActivityLog extends IBaseSchema, Pick<IBaseFields, 'id'> {
  userId: number
  user?: IUser | null
  action: string
}
/**
 * 前 --> 后
 */
export interface IActivityLogDto extends Omit<IActivityLog, keyof IBaseFields | 'deletedAt'> {}

/**
 * 前 <-- 后
 */
export interface IActivityLogVo extends Omit<IActivityLog, 'deletedAt'> {}

