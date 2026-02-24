import type { IBaseFields, IBaseSchema } from '../base'

/** 订阅状态枚举 */
export const CSubscriberStatus = {
  /** 待验证 */
  PENDING: 'pending',
  /** 已验证（生效中） */
  ACTIVE: 'active',
  /** 已退订 */
  UNSUBSCRIBED: 'unsubscribed',
} as const

export type SubscriberStatus = typeof CSubscriberStatus[keyof typeof CSubscriberStatus]

/** 订阅者接口 */
export interface ISubscriber extends IBaseSchema, Pick<IBaseFields, 'id'> {
  /** 订阅邮箱 */
  email: string
  /** 订阅者昵称（可选） */
  name?: string | null
  /** 验证/退订令牌 */
  token: string
  /** 订阅状态 */
  status: SubscriberStatus
}

/** 前 --> 后（创建订阅只需邮箱和可选昵称） */
export interface ISubscriberDto {
  email: string
  name?: string | null
}

/** 前 <-- 后 */
export interface ISubscriberVo extends Omit<ISubscriber, 'token' | 'deletedAt'> {}
