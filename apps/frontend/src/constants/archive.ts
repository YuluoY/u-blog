/**
 * 归档页卡片展示方案（与计划中六套方案对应）
 */
export const CArchiveCardStyle = {
  /** 方案一：摘要 + 标签行 */
  SUMMARY_TAGS: 'summary_tags',
  /** 方案二：封面图 + 右侧信息块 */
  COVER_INFO: 'cover_info',
  /** 方案三：极简一行 + 悬停展开 */
  MINIMAL_EXPAND: 'minimal_expand',
  /** 方案四：双行标题 + 统计条 */
  STATS_BAR: 'stats_bar',
  /** 方案五：时间轴强调 + 分类标签主视觉 */
  TIMELINE_TAGS: 'timeline_tags',
  /** 方案六：杂志式多列信息 */
  MAGAZINE: 'magazine',
} as const

export type ArchiveCardStyle = (typeof CArchiveCardStyle)[keyof typeof CArchiveCardStyle]

export const ARCHIVE_CARD_STYLE_DEFAULT: ArchiveCardStyle = CArchiveCardStyle.MINIMAL_EXPAND
