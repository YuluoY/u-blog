/**
 * Blog Layout MVP 设计令牌（v1）
 * 规范：桌面优先，4px 基础单位，间距步进 8/12/16/24/32
 */

/** 间距步进（px） */
export const SPACING = {
  UNIT: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
  XL: 32,
} as const

/** Header 高度（桌面 56-64px） */
export const HEADER_HEIGHT_PX = 60

/** Footer 高度（40-56px，底部信息条） */
export const FOOTER_HEIGHT_PX = 48

/** Icon Bar 宽度（紧凑约 56px，原 72px） */
export const ICON_BAR_WIDTH_PX = 56

/** Side Panel 宽度（224-360px，默认 280-320） */
export const SIDE_PANEL_WIDTH_PX = 300

/** 主内容区最大可读宽度（约 65 字符） */
export const MAIN_MAX_READABLE_PX = 720

/** 页面安全边距（桌面 32 / 平板 24 / 移动 16） */
export const PAGE_PADDING_PX = {
  desktop: 32,
  tablet: 24,
  mobile: 16,
} as const

/** 响应式断点（与规范一致） */
export const BREAKPOINT = {
  XS: 576,
  MD: 768,
  LG: 992,
} as const

/** 面板型 icon 类型 */
export const PANEL_ID = {
  /** 站长/用户信息 */
  PROFILE: 'profile',
  /** 发布记录（日历/热力图） */
  CALENDAR: 'calendar',
  /** 搜索 */
  SEARCH: 'search',
  /** 标签云 */
  TAGS: 'tags',
  /** 网站统计信息 */
  SITE_INFO: 'siteInfo',
} as const

export type PanelId = (typeof PANEL_ID)[keyof typeof PANEL_ID]
