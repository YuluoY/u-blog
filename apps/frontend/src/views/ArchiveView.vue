<template>
  <u-layout :padding="16">
    <u-region region="center">
      <u-timeline>
        <u-timeline-item
          v-for="item in articleList"
          :key="item.id"
          :date="formatDateTime(item.createdAt)"
          @dot-click="handleDotClick(item.id)"
        >
          <u-card
            :body-class="'timeline-item__card'"
            shadow="hover"
          >
            <div class="title">
              <u-text class="title-text" @click="handleDotClick(item.id)">{{ item.title }}</u-text>
            </div>
            <div class="info">
              <div class="info-item">
                <u-icon icon="fa-solid fa-clock"></u-icon>
                <span>{{ formatDateTime(item.updatedAt) }}</span>
              </div>
              <div class="info-item">
                <u-icon icon="fa-solid fa-eye"></u-icon>
                <span>{{ item.viewCount }}</span>
              </div>
              <div class="info-item">
                <u-icon icon="fa-solid fa-heart"></u-icon>
                <span>{{ item.likeCount }}</span>
              </div>
              <div class="info-item">
                <u-icon icon="fa-solid fa-comment"></u-icon>
                <span>{{ item.commentCount }}</span>
              </div>
            </div>
          </u-card>
        </u-timeline-item>
      </u-timeline>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useArticleStore } from '@/stores/model/article'
import { formatDateTime } from '@/utils/date'

defineOptions({
  name: 'ArchiveView'
})

const router = useRouter()
const articleStore = useArticleStore()
const articleList = computed(() => articleStore.articleList.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

const handleDotClick = (id: string) => {
  router.push(`/read/${id}`)
}
</script>

<style scoped lang="scss">
  :deep(.timeline-item__card) {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    .title {
      text-align: center;
      &-text {
        cursor: pointer;
      }
    }
    .info {
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .info-item {
        display: flex;
        align-items: center;
        .u-icon {
          margin-right: 0.4rem;
        }
      }
      .info-item ~ .info-item {
        margin-left: 1rem;
      }
    }
  }
</style>
