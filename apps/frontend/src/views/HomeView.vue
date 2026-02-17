<template>
  <div class="home" ref="homeRef">
    <div class="home__list">
      <component
        :is="listComponent"
        :key="articleListType"
        :data="articleStore.articleList"
        @jump="handleJump"
      />
    </div>
    <!-- 加载更多：滚动触底 or 手动点击 -->
    <div class="home__footer" ref="sentinelRef">
      <template v-if="articleStore.loading">
        <u-icon icon="fa-solid fa-spinner" spin />
        <u-text>{{ t('common.loading') }}</u-text>
      </template>
      <template v-else-if="!articleStore.hasMore">
        <u-text class="home__footer-end">{{ t('home.loadedAll') }}</u-text>
      </template>
      <template v-else>
        <u-button plain size="small" @click="articleStore.loadMore()">{{ t('home.loadMore') }}</u-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import ArticleListStyles from '@/components/ArticleListStyles'
import { CArticleList } from '@/types/const'
import { useAppStore } from '@/stores/app'
import { useArticleStore } from '@/stores/model/article'

defineOptions({
  name: 'HomeView'
})

const { t } = useI18n()
const appStore = useAppStore()
const { articleListType } = storeToRefs(appStore)
const articleStore = useArticleStore()
const router = useRouter()

/** 当前列表组件（显式依赖 articleListType，兜底 base） */
const listComponent = computed(
  () => ArticleListStyles[articleListType.value || CArticleList.BASE] ?? ArticleListStyles.base
)

const handleJump = (id: string) => router.push(`/read/${id}`)

/** IntersectionObserver 实现滚动触底自动加载 */
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() =>
{
  if (!sentinelRef.value) return
  observer = new IntersectionObserver(
    (entries) =>
    {
      if (entries[0]?.isIntersecting && articleStore.hasMore && !articleStore.loading) {
        articleStore.loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  observer.observe(sentinelRef.value)
})

onUnmounted(() =>
{
  observer?.disconnect()
})
</script>

<style scoped lang="scss">
.home {
  width: 100%;

  &__list {
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 0;
    color: var(--u-text-3, #999);
    font-size: 1.4rem;
  }

  &__footer-end {
    color: var(--u-text-4, #ccc);
    font-size: 1.3rem;
  }
}
</style>
