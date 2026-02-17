<template>
  <div class="site-info-panel">
    <u-text class="site-info-panel__title">{{ t('siteInfo.title') }}</u-text>
    <u-text v-if="error" type="danger" class="site-info-panel__error">{{ error }}</u-text>
    <template v-else-if="loading">
      <u-text class="site-info-panel__loading">{{ t('siteInfo.loading') }}</u-text>
    </template>
    <template v-else>
    <div class="site-info-panel__cards">
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-eye" />
        <u-text class="site-info-panel__card-num">{{ totalViews }}</u-text>
        <u-text class="site-info-panel__card-label">{{ t('siteInfo.views') }}</u-text>
      </div>
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-heart" />
        <u-text class="site-info-panel__card-num">{{ totalLikes }}</u-text>
        <u-text class="site-info-panel__card-label">{{ t('siteInfo.likes') }}</u-text>
      </div>
      <div class="site-info-panel__card">
        <u-icon icon="fa-solid fa-comment" />
        <u-text class="site-info-panel__card-num">{{ totalComments }}</u-text>
        <u-text class="site-info-panel__card-label">{{ t('siteInfo.comments') }}</u-text>
      </div>
    </div>
    <div class="site-info-panel__list">
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-rocket" />
        <span>{{ t('siteInfo.runningDays') }}</span>
        <span class="site-info-panel__val">{{ runningDays }} {{ t('siteInfo.days') }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-file-lines" />
        <span>{{ t('siteInfo.articles') }}</span>
        <span class="site-info-panel__val">{{ articleCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-folder" />
        <span>{{ t('siteInfo.categories') }}</span>
        <span class="site-info-panel__val">{{ categoryCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-tags" />
        <span>{{ t('siteInfo.tags') }}</span>
        <span class="site-info-panel__val">{{ tagCount }}</span>
      </div>
      <div class="site-info-panel__row">
        <u-icon icon="fa-solid fa-calendar-check" />
        <span>{{ t('siteInfo.lastUpdate') }}</span>
        <span class="site-info-panel__val">{{ lastUpdate }}</span>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getSiteOverview } from '@/api/siteOverview'
import type { SiteOverviewData } from '@/api/siteOverview'

defineOptions({ name: 'SiteInfoPanel' })

const { t } = useI18n()

const overview = ref<SiteOverviewData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const totalViews = computed(() => overview.value?.totalViews ?? 0)
const totalLikes = computed(() => overview.value?.totalLikes ?? 0)
const totalComments = computed(() => overview.value?.totalComments ?? 0)
const runningDays = computed(() => overview.value?.runningDays ?? 0)
const articleCount = computed(() => overview.value?.articleCount ?? 0)
const categoryCount = computed(() => overview.value?.categoryCount ?? 0)
const tagCount = computed(() => overview.value?.tagCount ?? 0)
const lastUpdate = computed(() => overview.value?.lastUpdate ?? '--')

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    overview.value = await getSiteOverview()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取失败'
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.site-info-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }

  &__error,
  &__loading {
    display: block;
    font-size: 1.2rem;
    margin-top: 8px;
  }
  &__loading {
    color: var(--u-text-3);
  }

  /* 三个数字卡片并排 */
  &__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 0;
    border-radius: 8px;
    background: var(--u-background-2);
    .u-icon { color: var(--u-text-3); }
  }

  &__card-num {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    display: block;
  }

  &__card-label {
    font-size: 1.1rem;
    color: var(--u-text-3);
    display: block;
  }

  /* 明细行 */
  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    font-size: 1.3rem;
    color: var(--u-text-2);
    transition: background 0.15s;
    &:hover { background: var(--u-background-2); }
    .u-icon { width: 14px; text-align: center; color: var(--u-text-3); }
  }

  &__val {
    margin-left: auto;
    font-weight: 600;
    color: var(--u-text-1);
  }
}
</style>
