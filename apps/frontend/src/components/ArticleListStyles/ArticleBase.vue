<template>
  <u-layout class="article-base article-list" :mode="'column'" :gutter="12">
    <u-region class="article-item" v-for="item in data" :key="item.id" @click="emit('jump', String(item.id))">
      <u-card :body-class="'article-item__card'" :shadow="'hover'" class="article-item__card-wrap">
        <div class="article-item__card-img">
          <img :src="item.cover" :alt="item.title" />
        </div>
        <div class="article-item__main">
          <div class="title">{{ item.title }}</div>
          <div class="author" v-if="item.user">
            <span>{{ t('article.author') }}</span>
            <span>{{ item.user.namec || item.user.username }}</span>
          </div>
          <div class="tags">
            <u-tag v-for="tag in item.tags" :key="tag.id" :color="tag.color"> {{ tag.name }} </u-tag>
          </div>
          <div class="desc">
            <u-text type="default" ellipsis :max-line="3">{{ item.desc }}</u-text>
          </div>
          <div class="info">
            <div class="info-left">
              <div class="publish-time info-item">
                <u-icon icon="calendar"></u-icon>
                <span>{{ formatDateTime(item.publishedAt) }}</span>
              </div>
              <div class="update-time info-item">
                <u-icon icon="fa-solid fa-clock-rotate-left"></u-icon>
                <span>{{ formatDateTime(item.updatedAt) }}</span>
              </div>
              <div class="view-count info-item">
                <u-icon icon="fa-solid fa-eye"></u-icon>
                <span>{{ item.viewCount }}</span>
              </div>
              <div class="like-count info-item">
                <u-icon icon="fa-solid fa-heart"></u-icon>
                <span>{{ item.likeCount }}</span>
              </div>
            </div>
            <div class="info-right">
              <div class="info-item">
                <u-icon icon="fa-solid fa-bookmark"></u-icon>
                <span>{{ t('article.collect') }}</span>
              </div>
              <div class="info-item">
                <u-icon icon="fa-solid fa-share-nodes"></u-icon>
                <span>{{ t('article.share') }}</span>
              </div>
              <div class="info-item" @click.stop>
                <u-button @click="emit('jump', String(item.id))">{{ t('article.browse') }}</u-button>
              </div>
            </div>
          </div>
        </div>
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IArticle } from '@u-blog/model'

const { t } = useI18n()
import { formatDateTime } from '@/utils/date'

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
.article-base.article-list {
  .article-item {
    cursor: pointer;
  }
  :deep(.article-item__card) {
    display: flex;
    width: 100%;
    transition: box-shadow 0.2s ease;
    .article-item__card-img {
      width: 28rem;
      min-width: 28rem;
      aspect-ratio: 4 / 3;
      margin-right: 1.6rem;
      overflow: hidden;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    .article-item__main {
      width: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 1.2rem;
      .title {
        width: 100%;
        font-size: 1.8rem;
        font-weight: 600;
        text-align: center;
        color: var(--u-text-1);
      }
      .author {
        width: 100%;
        display: flex;
        justify-content: center;
        font-size: 1.4rem;
        font-weight: 500;
        color: var(--u-text-2);
        span {
          margin-right: 0.4rem;
        }
      }

      .tags {
        width: 100%;
        display: flex;
        justify-content: center;
        .u-tag ~ .u-tag {
          margin-left: 0.8rem;
        }
      }

      .desc {
        flex: 1;
        color: var(--u-text-2);
      }

      .info {
        display: flex;
        justify-content: space-between;
        color: var(--u-text-3);
        .info-left,
        .info-right {
          display: flex;
        }
        .info-item {
          display: flex;
          align-items: center;
          margin-right: 1.2rem;
          .u-icon {
            margin-right: 0.4rem;
          }
        }
      }
    }
  }
}
</style>
