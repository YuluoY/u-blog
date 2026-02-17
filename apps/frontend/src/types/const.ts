/** 首页文章列表展示类型 */
export const CArticleList = {
  /** 列表：横向大卡，左图右文 */
  BASE: 'base',
  /** 卡片：网格多列，竖卡上图下文 */
  CARD: 'card',
  /** 瀑布流：多列不等高 */
  WATERFALL: 'waterfall',
  /** 紧凑列表：纯列表行，无图或小图 */
  COMPACT: 'compact'
} as const
