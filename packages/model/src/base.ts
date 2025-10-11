export const CTheme = {
  DEFAULT: 'default',
  LIGHT: 'light',
  DARK: 'dark'
} as const

export const CTables = {
  USER: 'user',
  ARTICLE: 'article',
  COMMENT: 'comment',
  CATEGORY: 'category',
  TAG: 'tag'
} as const

export const CLanguage = {
  ZH: 'zh',
  EN: 'en'
} as const

export type Theme = typeof CTheme[keyof typeof CTheme]
export type Tables = typeof CTables[keyof typeof CTables]
export type Language = typeof CLanguage[keyof typeof CLanguage]

export interface IBaseFields {
  id: string
  createdAt: string
  updatedAt: string
}
