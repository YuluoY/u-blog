import type { ArticleList } from '@/types'
import ArticleBase from './ArticleBase.vue'
import type { Component } from 'vue'

const components: Record<ArticleList, Component> = {
  base: ArticleBase,
  waterfall: ArticleBase,
  card: ArticleBase
}

export default components