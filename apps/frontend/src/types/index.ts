import type { CArticleList } from './const'

export type ArticleList = (typeof CArticleList)[keyof typeof CArticleList]

export type Tables = 'article' | 'users' | 'comment' | 'category' | 'tag'
