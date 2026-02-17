import type { ArticleList } from '@/types'
import ArticleBase from './ArticleBase.vue'
import ArticleCard from './ArticleCard.vue'
import ArticleWaterfall from './ArticleWaterfall.vue'
import ArticleCompact from './ArticleCompact.vue'
import type { Component } from 'vue'

const components: Record<ArticleList, Component> = {
  base: ArticleBase,
  card: ArticleCard,
  waterfall: ArticleWaterfall,
  compact: ArticleCompact
}

export default components