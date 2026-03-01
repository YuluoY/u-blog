import type { IBaseFields, IBaseSchema } from '../base'

/**
 * 公告接口
 * 用于站点横幅公告展示，支持简短标题 + 可选的 Markdown 详情内容
 */
export interface IAnnouncement extends IBaseSchema, Pick<IBaseFields, 'id'> {
  /** 公告简短标题（横幅上显示的文字） */
  title: string
  /** 公告详情内容（Markdown 格式，为空则只展示横幅标题） */
  content?: string | null
  /** 横幅背景色（如 #1890ff） */
  bgColor?: string | null
  /** 横幅文字颜色 */
  textColor?: string | null
  /** 是否启用 */
  isActive: boolean
  /** 排序权重（越大越靠前，同权取最新） */
  sort: number
}

/** 前 --> 后（创建/编辑公告） */
export interface IAnnouncementDto {
  title: string
  content?: string | null
  bgColor?: string | null
  textColor?: string | null
  isActive?: boolean
  sort?: number
}

/** 后 --> 前（查询响应） */
export type IAnnouncementVo = IAnnouncement
