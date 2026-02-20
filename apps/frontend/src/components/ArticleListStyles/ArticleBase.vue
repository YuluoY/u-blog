<template>
  <div class="article-base-list">
    <article
      v-for="(item, index) in data"
      :key="item.id"
      :class="['article-base-list__item', { 'article-base-list__item--right': index % 2 === 1 }]"
      @click="emit('jump', String(item.id))"
    >
      <div class="article-base-list__cover">
        <img :src="item.cover" :alt="item.title" />
      </div>
      <div class="article-base-list__main">
        <div class="article-base-list__title-row">
          <h3 class="article-base-list__title">{{ item.title }}</h3>
          <span v-if="item.isTop" class="article-base-list__badge article-base-list__badge--pinned">{{ t('article.pinned') }}</span>
          <span v-if="isHot(item)" class="article-base-list__badge article-base-list__badge--hot">{{ t('article.hot') }}</span>
        </div>
        <div v-if="item.user" class="article-base-list__author">
          {{ t('article.author') }} {{ item.user.namec || item.user.username }}
        </div>
        <div v-if="item.tags?.length" class="article-base-list__tags">
          <u-tag
            v-for="tag in item.tags.slice(0, 4)"
            :key="tag.id"
            :color="tag.color"
            size="small"
          >
            {{ tag.name }}
          </u-tag>
        </div>
        <p v-if="item.desc" class="article-base-list__desc">
          <u-text type="secondary" ellipsis :max-line="2">{{ item.desc }}</u-text>
        </p>
        <div class="article-base-list__meta">
          <span class="article-base-list__date">
            <u-icon icon="fa-solid fa-calendar-days" />
            {{ formatDateTime(item.publishedAt) }}
          </span>
          <span class="article-base-list__stat">
            <u-icon icon="fa-solid fa-eye" />
            {{ item.viewCount ?? 0 }}
          </span>
          <span class="article-base-list__stat">
            <u-icon icon="fa-solid fa-heart" />
            {{ item.likeCount ?? 0 }}
          </span>
          <u-button size="small" class="article-base-list__btn" @click.stop="emit('jump', String(item.id))">
            {{ t('article.browse') }}
          </u-button>
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

const { t } = useI18n()

function isHot(article: IArticle): boolean {
  return (article.viewCount ?? 0) >= ARTICLE_HOT_VIEW_THRESHOLD
}

const props = withDefaults(
  defineProps<{
    data: IArticle[]
  }>(),
  {
    data: () => []
  }
)

const emit = defineEmits<{
  (e: 'jump', id: string): void
}>()
</script>

<style scoped lang="scss">
.article-base-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.article-base-list__item {
  display: flex;
  align-items: stretch;
  min-height: 0;
  background: var(--u-background-1);
  border: 1px solid var(--u-border-1);
  border-radius: var(--u-border-radius-2, 10px);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--u-shadow-2);
    border-color: var(--u-border-2);
  }

  &--right {
    flex-direction: row-reverse;
  }
}

.article-base-list__cover {
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 16 / 10;
  background: var(--u-background-2);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.article-base-list__main {
  flex: 1;
  min-width: 0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article-base-list__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.article-base-list__title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--u-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  flex: 1;
  min-width: 0;
}

.article-base-list__badge {
  flex-shrink: 0;
  font-size: 1.1rem;
  padding: 2px 8px;
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

.article-base-list__author {
  font-size: 1.3rem;
  color: var(--u-text-3);
}

.article-base-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-base-list__desc {
  flex: 1;
  margin: 0;
  font-size: 1.35rem;
  color: var(--u-text-3);
  min-height: 0;
}

.article-base-list__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
  font-size: 1.25rem;
  color: var(--u-text-4);

  .article-base-list__date,
  .article-base-list__stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.article-base-list__btn {
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .article-base-list__item,
  .article-base-list__item--right {
    flex-direction: column;
  }

  .article-base-list__cover {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
}
</style>
