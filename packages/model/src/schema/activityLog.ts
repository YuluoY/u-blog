import type { IBaseFields } from '../base'
import type { IUser } from './user'

export interface IActivityLog extends IBaseFields {
  user: IUser
  action: string
}

export interface IActivityLogDto extends Omit<IActivityLog, keyof IBaseFields> {
  userId: string
}

