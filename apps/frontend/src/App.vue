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
import { setCurrentUser as setWriteDraftUser } from '@/utils/writeDraftDb'
import { setCurrentUser as setPublishSettingsUser } from '@/utils/publishSettingsDb'
import type { IUser } from '@u-blog/model'

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

// 监听用户切换，同步撰写相关 IndexedDB 的用户隔离
const userStore = useUserStore()
watch(
  () => (userStore.user as Partial<IUser>)?.id,
  (newId) => {
    const uid = newId ?? null
    setWriteDraftUser(uid)
    setPublishSettingsUser(uid)
  },
  { immediate: true }
)

// 应用启动时：拉取外观设置 + 站点元信息 + 各 model store 初始数据
onMounted(() => {
  getSettings([
    SETTING_KEYS.THEME,
    SETTING_KEYS.LANGUAGE,
    SETTING_KEYS.ARTICLE_LIST_TYPE,
    SETTING_KEYS.HOME_SORT,
    SETTING_KEYS.SITE_NAME,
    SETTING_KEYS.SITE_FAVICON,
    SETTING_KEYS.ONLY_OWN_ARTICLES,
  ])
    .then((data) => {
      const prevOnlyOwn = appStore.onlyOwnArticles
      appStore.hydrateAppearance(data)
      // 拉取到站点名称后立即更新当前页面 title
      appStore.updateDocumentTitle(route.meta.title as string | undefined)
      // 若"仅展示我的文章"设置变化，需重新拉取文章列表
      if (appStore.onlyOwnArticles !== prevOnlyOwn) {
        useArticleStore().qryArticleList()
      }
    })
    .catch(() => {})

  useCategoryStore().qryCategoryList()
  useTagStore().qryTagList()
  useArticleStore().qryArticleList()
  useUserStore().fetchUser()

  // 记录站点访问（后端按 IP 每日去重）
  recordSiteVisit().catch(() => {})
})
</script>
