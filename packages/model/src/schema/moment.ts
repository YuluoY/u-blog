import type { IBaseFields, IBaseSchema } from '../base'
import type { IUser } from './user'

/** 图片展示布局模式 */
export const CMomentImageLayout = {
  /** 九宫格 */
  GRID: 'grid',
  /** 合成长图 */
  LONG: 'long',
  /** 横向滚动 */
  SCROLL: 'scroll',
} as const

export type MomentImageLayout = typeof CMomentImageLayout[keyof typeof CMomentImageLayout]

/** 动态可见性 */
export const CMomentVisibility = {
  /** 公开 */
  PUBLIC: 'public',
  /** 仅自己可见 */
  PRIVATE: 'private',
} as const

export type MomentVisibility = typeof CMomentVisibility[keyof typeof CMomentVisibility]

/**
 * 动态实体接口
 *
 * 博主发布的短内容流，支持 Markdown 正文 + 可选图片 + 心情/标签/天气附加字段。
 * 所有公开动态对所有用户（含游客）可见。
 */
export interface IMoment extends IBaseSchema, Pick<IBaseFields, 'id'> {
  /** 发布者 ID */
  userId: number
  /** 发布者 */
  user?: IUser

  /** 动态正文（Markdown） */
  content: string
  /** 图片 URL 列表 */
  images?: string[] | null
  /** 图片展示布局 */
  imageLayout?: MomentImageLayout | null

  /** 心情 emoji（可选） */
  mood?: string | null
  /** 标签列表（可选） */
  tags?: string[] | null
  /** 天气信息（可选，手动选择或 IP 自动获取） */
  weather?: string | null

  /** 可见性：public / private */
  visibility: MomentVisibility
  /** 是否置顶 */
  isPinned: boolean

  /** 点赞数 */
  likeCount: number
  /** 评论数 */
  commentCount: number
}

/**
 * 前端 → 后端：创建/更新动态的 DTO
 */
export interface IMomentDto extends Omit<IMoment, keyof IBaseFields | 'deletedAt' | 'user' | 'likeCount' | 'commentCount'> {}

/**
 * 后端 → 前端：动态查询结果 VO
 */
export interface IMomentVo extends Omit<IMoment, 'deletedAt'> {}
