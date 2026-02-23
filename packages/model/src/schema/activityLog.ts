import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

/** 行为事件类型常量 */
export const CActivityType = {
  PAGE_VIEW: 'page_view',
  ARTICLE_VIEW: 'article_view',
  ARTICLE_LIKE: 'article_like',
  ARTICLE_SHARE: 'article_share',
  SEARCH: 'search',
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  COMMENT: 'comment',
  CLICK: 'click',
} as const

export type ActivityType = typeof CActivityType[keyof typeof CActivityType]

/** 用户行为日志实体 */
export interface IActivityLog extends IBaseSchema, Pick<IBaseFields, 'id'> {
  type: ActivityType
  userId?: number | null
  user?: IUser | null
  sessionId?: string | null
  ip?: string | null
  location?: string | null
  browser?: string | null
  device?: string | null
  os?: string | null
  path?: string | null
  referer?: string | null
  metadata?: Record<string, unknown> | null
  duration?: number | null
}

/** 前端上报事件 DTO */
export interface IActivityLogDto {
  type: ActivityType
  sessionId?: string
  path?: string
  referer?: string
  metadata?: Record<string, unknown>
  duration?: number
}

/** 前端批量上报 DTO */
export interface IActivityLogBatchDto {
  events: IActivityLogDto[]
}

/** 后端返回的行为日志 Vo */
export interface IActivityLogVo extends Omit<IActivityLog, 'deletedAt'> {}

/** 统计概览 */
export interface IAnalyticsOverview {
  todayPv: number
  todayUv: number
  totalPv: number
  totalUv: number
  todayNewUsers: number
  avgDuration: number
}

/** 趋势数据点 */
export interface IAnalyticsTrend {
  date: string
  pv: number
  uv: number
}

/** 页面排行 */
export interface IPageRank {
  path: string
  pv: number
  uv: number
  avgDuration: number
}

/** 地域分布 */
export interface IGeoDistribution {
  location: string
  count: number
}

/** 浏览器/设备分布 */
export interface IDeviceDistribution {
  name: string
  count: number
}
