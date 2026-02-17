<template>
  <div class="article-waterfall">
    <article
      v-for="item in data"
      :key="item.id"
      class="article-waterfall__item"
      @click="emit('jump', String(item.id))"
    >
      <div v-if="item.cover" class="article-waterfall__cover">
        <img :src="item.cover" :alt="item.title" />
      </div>
      <div class="article-waterfall__body">
        <h3 class="article-waterfall__title">{{ item.title }}</h3>
        <div v-if="item.tags?.length" class="article-waterfall__tags">
          <u-tag
            v-for="tag in item.tags.slice(0, 4)"
            :key="tag.id"
            :color="tag.color"
            size="small"
          >
            {{ tag.name }}
          </u-tag>
        </div>
        <p v-if="item.desc" class="article-waterfall__desc">
          <u-text type="secondary" ellipsis :max-line="2">{{ item.desc }}</u-text>
        </p>
        <div class="article-waterfall__meta">
          <span>{{ formatDateTime(item.publishedAt) }}</span>
          <span> · {{ item.viewCount ?? 0 }} {{ t('read.viewCount') }}</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IArticle } from '@u-blog/model'
import { formatDateTime } from '@/utils/date'

defineOptions({ name: 'ArticleWaterfall' })

const { t } = useI18n()

defineProps<{
  data: IArticle[]
}>({
  data: () => []
})

const emit = defineEmits<{
  (e: 'jump', id: string): void
}>()
</script>

<style lang="scss" scoped>
.article-waterfall {
  column-count: 2;
  column-gap: 20px;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 900px) {
    column-count: 3;
  }

  @media (min-width: 1200px) {
    column-count: 4;
  }

  &__item {
    break-inside: avoid;
    margin-bottom: 20px;
    background: var(--u-background-1);
    border-radius: var(--u-border-radius-2, 8px);
    overflow: hidden;
    border: 1px solid var(--u-border-1);
    cursor: pointer;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: var(--u-shadow-2);
    }
  }

  &__cover {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--u-background-2);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__body {
    padding: 14px;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--u-text-1);
    margin: 0 0 8px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  &__desc {
    margin: 0 0 8px 0;
    font-size: 1.3rem;
    color: var(--u-text-3);
  }

  &__meta {
    font-size: 1.2rem;
    color: var(--u-text-4);
  }
}
</style>
