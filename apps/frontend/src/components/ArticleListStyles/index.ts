import type { ArticleListType } from '@/types'
import ArticleBase from './ArticleBase.vue'
import type { Component } from 'vue'

const components: Record<ArticleListType, Component> = {
  base: ArticleBase,
  waterfall: ArticleBase,
  card: ArticleBase
}

export default components