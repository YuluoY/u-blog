<template>
  <!-- 登录页独立全屏渲染，不使用 LayoutBase -->
  <template v-if="isFullscreenRoute">
    <RouterView />
  </template>
  <template v-else>
    <LayoutBase>
      <RouterView v-slot="{ Component }">
        <!-- 撰写页保持挂载，避免切换回来时 MdEditor 重新渲染、内容不丢失 -->
        <KeepAlive :include="['WriteView']">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </LayoutBase>
  </template>
  <Snowfall v-if="showSnowfall" :options="appStore.snowfallOptions" />
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutBase from '@/components/LayoutBase.vue'
import { useAppStore } from '@/stores/app'
import { fetchTodayHasSnowByIP } from '@/api/snowfallWeather'
import { useCategoryStore } from '@/stores/model/category'
import { useTagStore } from '@/stores/model/tag'
import { useArticleStore } from '@/stores/model/article'
import { useUserStore } from '@/stores/model/user'
import { i18n } from '@/locales'
import { getSettings } from '@/api/settings'
import { recordSiteVisit } from '@/api/request'
import { SETTING_KEYS } from '@/constants/settings'

const appStore = useAppStore()
const route = useRoute()

/** 需要独立全屏渲染的路由（不包裹 LayoutBase） */
const FULLSCREEN_ROUTES = new Set(['login'])
const isFullscreenRoute = computed(() => FULLSCREEN_ROUTES.has(route.name as string))

const showSnowfall = computed(() => {
  if (appStore.snowfallMode === 'off') return false
  if (appStore.snowfallMode === 'on') return true
  return appStore.snowfallMode === 'auto' && appStore.todayHasSnow
})

watch(
  () => appStore.snowfallMode,
  (mode) => {
    if (mode === 'auto') {
      fetchTodayHasSnowByIP().then((hasSnow) => appStore.setTodayHasSnow(hasSnow))
    }
  },
  { immediate: true }
)

// 在组件上下文中监听 language 并同步到 i18n，确保 locale 变化触发整树重渲染
watch(
  () => appStore.language,
  (l) => {
    if (l) i18n.global.locale.value = l
  },
  { immediate: true }
)

// 应用启动时：拉取外观设置 + 各 model store 初始数据；飘雪自动模式时查询当日是否下雪
onMounted(() => {
  getSettings([SETTING_KEYS.THEME, SETTING_KEYS.LANGUAGE, SETTING_KEYS.ARTICLE_LIST_TYPE, SETTING_KEYS.HOME_SORT])
    .then((data) => appStore.hydrateAppearance(data))
    .catch(() => {})

  useCategoryStore().qryCategoryList()
  useTagStore().qryTagList()
  useArticleStore().qryArticleList()
  useUserStore().fetchUser()

  // 记录站点访问（后端按 IP 每日去重）
  recordSiteVisit().catch(() => {})
})
</script>
