<template>
  <u-layout class="moments-view">
    <u-region region="center" class="moments-view__center">
      <!-- 博主发布框（仅 admin/super_admin 可见） -->
      <MomentPublishBox v-if="isAdmin" />

      <!-- 动态列表 -->
      <div class="moments-view__list">
        <MomentCard
          v-for="moment in momentStore.momentList"
          :key="moment.id"
          :moment="moment"
          @toggle-comments="handleToggleComments"
        >
          <!-- 评论区插槽：展开时加载 -->
          <template #comments>
            <MomentCommentSection
              :moment-id="moment.id"
            />
          </template>
        </MomentCard>
      </div>

      <!-- 加载更多 / 滚动触底哨兵 -->
      <div class="moments-view__footer" ref="sentinelRef">
        <template v-if="momentStore.loading">
          <u-icon icon="fa-solid fa-spinner" spin />
          <u-text>{{ t('common.loading') }}</u-text>
        </template>
        <template v-else-if="!momentStore.hasMore && momentStore.momentList.length > 0">
          <u-text class="moments-view__footer-end">{{ t('moments.loadedAll') }}</u-text>
        </template>
        <template v-else-if="momentStore.momentList.length === 0 && !momentStore.loading">
          <u-text class="moments-view__footer-end">{{ t('moments.empty') }}</u-text>
        </template>
        <template v-else>
          <u-button plain size="small" @click="momentStore.loadMore()">{{ t('moments.loadMore') }}</u-button>
        </template>
      </div>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMomentStore } from '@/stores/model/moment'
import { useUserStore } from '@/stores/model/user'
import { useCommentStore } from '@/stores/model/comment'
import MomentCard from '@/components/Moment/MomentCard.vue'
import MomentPublishBox from '@/components/Moment/MomentPublishBox.vue'
import MomentCommentSection from '@/components/Moment/MomentCommentSection.vue'

defineOptions({ name: 'MomentsView' })

const { t } = useI18n()
const momentStore = useMomentStore()
const userStore = useUserStore()
const commentStore = useCommentStore()

/** 当前用户是否为已登录的 admin/super_admin（控制发布框可见性） */
const isAdmin = computed(() => {
  if (!userStore.isLoggedIn) return false
  const role = userStore.user?.role
  return role === 'admin' || role === 'super_admin'
})

/* ---------- 首次加载 ---------- */
onMounted(() => {
  momentStore.qryMomentList()
  initObserver()
})

/* ---------- 评论区展开事件：首次展开时拉取该动态的评论 ---------- */
function handleToggleComments(momentId: number, visible: boolean) {
  if (visible) {
    const path = `/moments/${momentId}`
    commentStore.qryCommentListByPath(path, false)
  }
}

/* ---------- IntersectionObserver 无限滚动 ---------- */
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function initObserver() {
  if (!sentinelRef.value) return
  const scrollRoot = document.querySelector('.layout-base__main') as HTMLElement | null
  observer = new IntersectionObserver(
    entries => {
      if (entries[0]?.isIntersecting && momentStore.hasMore && !momentStore.loading)
        momentStore.loadMore()
    },
    { root: scrollRoot, rootMargin: '0px' },
  )
  observer.observe(sentinelRef.value)
}

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.moments-view__center {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
}

.moments-view__list {
  position: relative;
}

.moments-view__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 32px;
  color: var(--u-text-secondary, #909399);
  font-size: 13px;
}

.moments-view__footer-end {
  color: var(--u-text-placeholder, #c0c4cc);
}
</style>
