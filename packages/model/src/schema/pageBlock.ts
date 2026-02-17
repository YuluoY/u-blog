import type { IBaseFields, IBaseSchema } from '../base'

export const CPageBlockType = {
  INTRO: 'intro',
  WHOAMI: 'whoami',
  EXPERIENCE: 'experience',
  WHY_BLOG: 'why_blog',
  TIMELINE: 'timeline',
  SKILLS: 'skills',
  CUSTOM: 'custom',
} as const

export type PageBlockType = (typeof CPageBlockType)[keyof typeof CPageBlockType]

export interface IPageBlock extends IBaseSchema, Pick<IBaseFields, 'id'> {
  page: string
  sortOrder: number
  type: PageBlockType
  title?: string | null
  content: string
  extra?: Record<string, unknown> | null
}

export interface IPageBlockDto extends Omit<IPageBlock, keyof IBaseFields | 'deletedAt'> {}

export interface IPageBlockVo extends Omit<IPageBlock, 'deletedAt'> {}
