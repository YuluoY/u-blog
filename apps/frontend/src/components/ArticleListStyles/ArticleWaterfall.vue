<template>
  <div class="article-waterfall">
    <article
      v-for="(item, index) in data"
      :key="item.id"
      class="article-waterfall__item"
      @click="emit('jump', String(item.id))"
    >
      <div v-if="item.cover" class="article-waterfall__cover">
        <img :src="coverUrl(item.cover)" :alt="item.title" :loading="index === 0 ? 'eager' : 'lazy'" :fetchpriority="index === 0 ? 'high' : undefined" />
      </div>
      <div class="article-waterfall__body">
        <div class="article-waterfall__title-row">
          <h3 class="article-waterfall__title">
            <a
              class="article-waterfall__title-link"
              :href="`/read/${item.id}`"
              @click.stop.prevent="emit('jump', String(item.id))"
            >
              {{ item.title }}
            </a>
          </h3>
          <span v-if="item.isTop" class="article-waterfall__badge article-waterfall__badge--pinned">{{ t('article.pinned') }}</span>
          <span v-if="isHot(item)" class="article-waterfall__badge article-waterfall__badge--hot">{{ t('article.hot') }}</span>
          <span class="article-waterfall__badge" :class="item.isOriginal !== false ? 'article-waterfall__badge--original' : 'article-waterfall__badge--repost'">{{ item.isOriginal !== false ? t('article.original') : t('article.repost') }}</span>
        </div>
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
import { ARTICLE_HOT_VIEW_THRESHOLD } from '@/constants/settings'
import { getOptimizedImageUrl, COVER_PRESETS } from '@/utils/image'

const coverUrl = (src: string) => getOptimizedImageUrl(src, COVER_PRESETS.thumb)

defineOptions({ name: 'ArticleWaterfall' })

const { t } = useI18n()

function isHot(article: IArticle): boolean
{
  return (article.viewCount ?? 0) >= ARTICLE_HOT_VIEW_THRESHOLD
}

const props = withDefaults(defineProps<{
  data: IArticle[]
}>(), {
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

  &__title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
    margin-bottom: 8px;
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__title-link {
    color: inherit;
    text-decoration: none;
  }

  &__badge {
    flex-shrink: 0;
    font-size: 1.05rem;
    padding: 2px 6px;
    border-radius: var(--u-border-radius-4, 4px);
    font-weight: 500;

    &--pinned {
      background: var(--u-primary);
      color: #fff;
    }

    &--hot {
      background: #fff1f0;
      color: #ff4d4f;
    }

    &--original {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    &--repost {
      background: rgba(107, 114, 128, 0.12);
      color: #6b7280;
    }
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
