import type { CArticleList } from './const'

export type ArticleList = (typeof CArticleList)[keyof typeof CArticleList]
