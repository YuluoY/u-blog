export const CTheme = {
  DEFAULT: 'default',
  LIGHT: 'light',
  DARK: 'dark'
} as const

export const CVisualStyle = {
  DEFAULT: 'default',
  GLASS: 'glass'
} as const

export const CTable = {
  USER: 'users',
  ARTICLE: 'article',
  COMMENT: 'comment',
  CATEGORY: 'category',
  TAG: 'tag',
  FOLLOWER: 'follower',
  LIKE: 'like',
  MEDIA: 'media',
  PERMISSION: 'permission',
  ROLE: 'role',
  ROUTE: 'route',
  SETTING: 'setting',
  VIEW: 'view',
  ACTIVITY_LOG: 'activity_log',
  AUTHOR: 'author',
  ARTICLE_TAG: 'article_tag',
  ROLE_PERMISSION: 'role_permission',
  PAGE_BLOCK: 'page_block',
} as const

export const CLanguage = {
  ZH: 'zh',
  EN: 'en'
} as const

/**
 * 自定义类型集合
 */
export const CCustomType = {
	USER_ROLE: 'user_role',
	ARTICLE_STATUS: 'article_status'
} as const

/**
 * token中的payload字段数据
 * @constant { Array<string> }
 */
export const PAYLOAD_FIELD = ['id', 'username', 'role'] as const

export type Theme = typeof CTheme[keyof typeof CTheme]
export type VisualStyle = typeof CVisualStyle[keyof typeof CVisualStyle]
export type Table = typeof CTable[keyof typeof CTable]
export type Language = typeof CLanguage[keyof typeof CLanguage]
export type CustomType = typeof CCustomType[keyof typeof CCustomType]

export interface IBaseFields {
  id: number
  createdAt: Date
  updatedAt: Date
}

export interface IBaseSchema {
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
