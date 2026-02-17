<template>
  <div class="article-compact">
    <article
      v-for="(item, index) in data"
      :key="item.id"
      class="article-compact__row"
      @click="emit('jump', String(item.id))"
    >
      <div class="article-compact__index">{{ index + 1 }}</div>
      <div v-if="item.cover" class="article-compact__thumb">
        <img :src="item.cover" :alt="item.title" />
      </div>
      <div class="article-compact__main">
        <h3 class="article-compact__title">{{ item.title }}</h3>
        <div class="article-compact__meta">
          <span v-if="item.user" class="article-compact__author">
            {{ item.user.namec || item.user.username }}
          </span>
          <span class="article-compact__date">{{ formatDateTime(item.publishedAt) }}</span>
          <span class="article-compact__stat">{{ item.viewCount ?? 0 }} {{ t('read.viewCount') }}</span>
          <span class="article-compact__stat">{{ item.likeCount ?? 0 }} {{ t('read.like') }}</span>
        </div>
      </div>
      <u-icon icon="fa-solid fa-chevron-right" class="article-compact__arrow" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IArticle } from '@u-blog/model'
import { formatDateTime } from '@/utils/date'

defineOptions({ name: 'ArticleCompact' })

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
.article-compact {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--u-border-1);
  border-radius: var(--u-border-radius-2, 8px);
  overflow: hidden;
  background: var(--u-background-1);

  &__row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    cursor: pointer;
    border-bottom: 1px solid var(--u-border-1);
    transition: background 0.15s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--u-background-2);
    }
  }

  &__index {
    flex-shrink: 0;
    width: 28px;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--u-text-4);
    text-align: right;
  }

  &__thumb {
    flex-shrink: 0;
    width: 56px;
    height: 42px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--u-background-2);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--u-text-1);
    margin: 0 0 4px 0;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    color: var(--u-text-4);
  }

  &__author {
    color: var(--u-text-3);
  }

  &__arrow {
    flex-shrink: 0;
    font-size: 1.2rem;
    color: var(--u-text-4);
  }
}
</style>
