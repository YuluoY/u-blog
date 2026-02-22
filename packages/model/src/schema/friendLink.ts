import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

/**
 * 友链状态枚举
 * pending: 待审核  approved: 已通过  rejected: 已拒绝
 */
export const CFriendLinkStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type FriendLinkStatus = typeof CFriendLinkStatus[keyof typeof CFriendLinkStatus]

/**
 * 友情链接接口
 * 支持双向申请：访客提交友链申请 → 博主审核通过/拒绝
 */
export interface IFriendLink extends IBaseSchema, Pick<IBaseFields, 'id'> {
  /** 所属博主用户 ID */
  userId: number
  /** 所属博主 */
  user?: IUser
  /** 友链网站 URL */
  url: string
  /** 网站标题（自动抓取或手动填写） */
  title: string
  /** 网站图标 URL（自动抓取 favicon 或手动填写） */
  icon?: string
  /** 简介描述 */
  description?: string
  /** 申请人邮箱（用于通知） */
  email?: string
  /** 审核状态 */
  status: FriendLinkStatus
  /** 排序权重（越大越靠前） */
  sortOrder?: number
}

/** 前 --> 后：提交友链申请 */
export interface IFriendLinkDto extends Pick<IFriendLink, 'url' | 'title' | 'description' | 'email'> {
  /** 目标博主的用户 ID */
  userId?: number
  /** 网站图标（可选，不传则由后端自动抓取） */
  icon?: string
}

/** 前 <-- 后 */
export interface IFriendLinkVo extends Omit<IFriendLink, 'deletedAt'> {}
