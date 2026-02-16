<template>
  <div class="site-info-panel">
    <u-text class="site-info-panel__title">网站概览</u-text>
    <!-- 核心数字卡：来自 article 表聚合 -->
    <div class="site-info-panel__cards">
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-eye" />
        <u-text class="site-info-panel__card-num">{{ totalViews }}</u-text>
        <u-text class="site-info-panel__card-label">总浏览</u-text>
      </div>
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-heart" />
        <u-text class="site-info-panel__card-num">{{ totalLikes }}</u-text>
        <u-text class="site-info-panel__card-label">总点赞</u-text>
      </div>
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-comment" />
        <u-text class="site-info-panel__card-num">{{ totalComments }}</u-text>
        <u-text class="site-info-panel__card-label">总评论</u-text>
      </div>
    </div>
    <!-- 明细：运行天数、内容量 -->
    <div class="site-info-panel__list">
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-rocket" />
        <span>运行天数</span>
        <span class="site-info-panel__val">{{ runningDays }} 天</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-file-lines" />
        <span>文章</span>
        <span class="site-info-panel__val">{{ articleCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-folder" />
        <span>分类</span>
        <span class="site-info-panel__val">{{ categoryCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-tags" />
        <span>标签</span>
        <span class="site-info-panel__val">{{ tagCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-calendar-check" />
        <span>最后更新</span>
        <span class="site-info-panel__val">{{ lastUpdate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleStore } from '@/stores/model/article'
import { useCategoryStore } from '@/stores/model/category'
import { useTagStore } from '@/stores/model/tag'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'SiteInfoPanel' })

const { articleList } = storeToRefs(useArticleStore())
const { categoryList } = storeToRefs(useCategoryStore())
const { tagList } = storeToRefs(useTagStore())

const articleCount = computed(() => articleList.value.length)
const categoryCount = computed(() => categoryList.value.length)
const tagCount = computed(() => tagList.value.length)

/** 从 article 表的 viewCount/likeCount/commentCount 聚合 */
const totalViews = computed(() =>
  articleList.value.reduce((s, a) => s + (a.viewCount ?? 0), 0)
)
const totalLikes = computed(() =>
  articleList.value.reduce((s, a) => s + (a.likeCount ?? 0), 0)
)
const totalComments = computed(() =>
  articleList.value.reduce((s, a) => s + (a.commentCount ?? 0), 0)
)

/** 运行天数：以最早文章 createdAt 为起点 */
const runningDays = computed(() => {
  if (!articleList.value.length) return 0
  const earliest = articleList.value.reduce((a, b) =>
    new Date(a.createdAt).getTime() < new Date(b.createdAt).getTime() ? a : b
  )
  return Math.max(1, Math.floor((Date.now() - new Date(earliest.createdAt).getTime()) / 86400000))
})

/** 最后更新日期 */
const lastUpdate = computed(() => {
  if (!articleList.value.length) return '--'
  const latest = articleList.value.reduce((a, b) =>
    new Date(b.updatedAt).getTime() > new Date(a.updatedAt).getTime() ? b : a
  )
  const d = new Date(latest.updatedAt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style lang="scss" scoped>
.site-info-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }

  /* 三个数字卡片并排 */
  &__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 0;
    border-radius: 8px;
    background: var(--u-background-2);
    .u-icon { color: var(--u-text-3); }
  }

  &__card-num {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    display: block;
  }

  &__card-label {
    font-size: 1.1rem;
    color: var(--u-text-3);
    display: block;
  }

  /* 明细行 */
  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    font-size: 1.3rem;
    color: var(--u-text-2);
    transition: background 0.15s;
    &:hover { background: var(--u-background-2); }
    .u-icon { width: 14px; text-align: center; color: var(--u-text-3); }
  }

  &__val {
    margin-left: auto;
    font-weight: 600;
    color: var(--u-text-1);
  }
}
</style>
