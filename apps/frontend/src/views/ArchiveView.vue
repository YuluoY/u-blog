<template>
  <u-layout :padding="16">
    <u-region region="center">
      <template v-if="articleStore.archiveLoading">
        <div class="archive-loading">
          <u-icon icon="fa-solid fa-spinner" spin />
          <u-text>{{ t('archive.loading') }}</u-text>
        </div>
      </template>
      <u-timeline v-else :data="archiveTimelineData">
        <u-timeline-item
          v-for="item in archiveList"
          :key="item.id"
          :date="formatDateTime(item.createdAt)"
          @dot-click="handleDotClick(String(item.id))"
        >
          <u-card
            :body-class="'timeline-item__card'"
            shadow="hover"
          >
            <div class="title">
              <u-text class="title-text" @click="handleDotClick(String(item.id))">{{ item.title }}</u-text>
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
import { useI18n } from 'vue-i18n'
import { useArticleStore } from '@/stores/model/article'
import { formatDateTime } from '@/utils/date'

const { t } = useI18n()

defineOptions({
  name: 'ArchiveView'
})

const router = useRouter()
const articleStore = useArticleStore()
const archiveList = computed(() => articleStore.archiveList)
const archiveTimelineData = computed(() =>
  archiveList.value.map(a => ({ date: formatDateTime(a.createdAt) }))
)

onMounted(() => {
  articleStore.qryArchiveList()
})

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

.archive-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--u-text-3);
}
</style>
