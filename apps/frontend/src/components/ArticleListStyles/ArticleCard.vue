<template>
  <div class="article-card-list">
    <article
      v-for="item in data"
      :key="item.id"
      class="article-card-list__item"
      @click="emit('jump', String(item.id))"
    >
      <div class="article-card-list__cover">
        <img :src="item.cover" :alt="item.title" />
      </div>
      <div class="article-card-list__body">
        <div class="article-card-list__title-row">
          <h3 class="article-card-list__title">{{ item.title }}</h3>
          <span v-if="item.isTop" class="article-card-list__badge article-card-list__badge--pinned">{{ t('article.pinned') }}</span>
          <span v-if="isHot(item)" class="article-card-list__badge article-card-list__badge--hot">{{ t('article.hot') }}</span>
        </div>
        <div v-if="item.user" class="article-card-list__author">
          {{ item.user.namec || item.user.username }}
        </div>
        <div v-if="item.tags?.length" class="article-card-list__tags">
          <u-tag
            v-for="tag in item.tags.slice(0, 3)"
            :key="tag.id"
            :color="tag.color"
            size="small"
          >
            {{ tag.name }}
          </u-tag>
        </div>
        <p v-if="item.desc" class="article-card-list__desc">
          <u-text type="secondary" ellipsis :max-line="2">{{ item.desc }}</u-text>
        </p>
        <div class="article-card-list__meta">
          <span class="article-card-list__date">{{ formatDateTime(item.publishedAt) }}</span>
          <span class="article-card-list__stat">
            <u-icon icon="fa-solid fa-eye" />
            {{ item.viewCount ?? 0 }}
          </span>
          <span class="article-card-list__stat">
            <u-icon icon="fa-solid fa-heart" />
            {{ item.likeCount ?? 0 }}
          </span>
        </div>
        <u-button size="small" class="article-card-list__btn">{{ t('article.browse') }}</u-button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IArticle } from '@u-blog/model'
import { formatDateTime } from '@/utils/date'
import { ARTICLE_HOT_VIEW_THRESHOLD } from '@/constants/settings'

defineOptions({ name: 'ArticleCard' })

const { t } = useI18n()

function isHot(article: IArticle): boolean {
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
.article-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  box-sizing: border-box;

  &__item {
    display: flex;
    flex-direction: column;
    background: var(--u-background-1);
    border-radius: var(--u-border-radius-2, 8px);
    overflow: hidden;
    border: 1px solid var(--u-border-1);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--u-shadow-3);
    }
  }

  &__cover {
    width: 100%;
    aspect-ratio: 16 / 10;
    background: var(--u-background-2);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__badge {
    flex-shrink: 0;
    font-size: 1.05rem;
    padding: 2px 6px;
    border-radius: var(--u-border-radius-4, 4px);
    font-weight: 500;

    &--pinned {
      background: var(--u-primary-2, #e8f4ff);
      color: var(--u-primary-0, #1890ff);
    }

    &--hot {
      background: #fff1f0;
      color: #ff4d4f;
    }
  }

  &__author {
    font-size: 1.3rem;
    color: var(--u-text-3);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__desc {
    flex: 1;
    margin: 0;
    font-size: 1.3rem;
    color: var(--u-text-3);
    min-height: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    color: var(--u-text-4);
  }

  &__stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__btn {
    align-self: flex-start;
    margin-top: 4px;
  }
}
</style>
