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
  <!-- 网站版本更新提示（生产环境自动检测） -->
  <UpdateToast />
  <!-- 全局订阅弹窗 -->
  <SubscribeModal v-model:visible="subscribeModalVisible" />
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutBase from '@/components/LayoutBase.vue'
import UpdateToast from '@/components/UpdateToast.vue'
import SubscribeModal from '@/components/SubscribeModal.vue'
import { useAppStore } from '@/stores/app'
import { useBlogOwnerStore } from '@/stores/blogOwner'
import { fetchTodayHasSnowByIP } from '@/api/snowfallWeather'
import { useCategoryStore } from '@/stores/model/category'
import { useTagStore } from '@/stores/model/tag'
import { useArticleStore } from '@/stores/model/article'
import { useUserStore } from '@/stores/model/user'
import { i18n } from '@/locales'
import { getSettings, type SettingsMap } from '@/api/settings'
import { recordSiteVisit } from '@/api/request'
import { SETTING_KEYS } from '@/constants/settings'
import { useFooterStore } from '@/stores/footer'
import { setCurrentUser as setWriteDraftUser } from '@/utils/writeDraftDb'
import { setCurrentUser as setPublishSettingsUser } from '@/utils/publishSettingsDb'
import { useActivityTracker } from '@/composables/useActivityTracker'
import { useSubscribe } from '@/composables/useSubscribe'
import { UMessageFn } from '@u-blog/ui'
import type { IUser } from '@u-blog/model'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

// 初始化行为追踪
useActivityTracker()

// 订阅弹窗全局状态
const { subscribeModalVisible } = useSubscribe()

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

// 应用启动时：初始化博客拥有者（子域名检测）→ 拉取外观设置 + 站点元信息 + 各 model store 初始数据
onMounted(async () => {
  // 优先初始化博客拥有者（后续数据查询依赖 blogOwnerId 过滤）
  const blogOwnerStore = useBlogOwnerStore()
  await blogOwnerStore.init()

  // 合并所有设置 keys 为一次请求（包含外观 + footer），减少网络往返
  getSettings([
    SETTING_KEYS.THEME,
    SETTING_KEYS.LANGUAGE,
    SETTING_KEYS.ARTICLE_LIST_TYPE,
    SETTING_KEYS.HOME_SORT,
    SETTING_KEYS.SITE_NAME,
    SETTING_KEYS.SITE_FAVICON,
    SETTING_KEYS.ONLY_OWN_ARTICLES,
    SETTING_KEYS.FOOTER_ICP_NUMBER,
    SETTING_KEYS.FOOTER_ICP_LINK,
    SETTING_KEYS.FOOTER_ICP_VISIBLE,
    SETTING_KEYS.FOOTER_MOE_ICP_NUMBER,
    SETTING_KEYS.FOOTER_MOE_ICP_LINK,
    SETTING_KEYS.FOOTER_MOE_ICP_VISIBLE,
    SETTING_KEYS.FOOTER_AUTHOR,
  ])
    .then((data: SettingsMap) => {
      const prevOnlyOwn = appStore.onlyOwnArticles
      appStore.hydrateAppearance(data)
      appStore.updateDocumentTitle(route.meta.title as string | undefined)

      // 使用同一份 settings 数据写入 footerStore，不再二次请求
      useFooterStore().hydrateFromSettings(data)

      // settings 确认后再加载文章列表（排序依赖 homeSort）
      useArticleStore().qryArticleList()
      // 若"仅展示我的文章"设置变化，强制刷新
      if (appStore.onlyOwnArticles !== prevOnlyOwn) {
        useArticleStore().qryArticleList()
      }
    })
    .catch(() => {
      // settings 请求失败也要保证文章列表加载
      useArticleStore().qryArticleList()
    })

  useCategoryStore().qryCategoryList()
  useTagStore().qryTagList()
  // fetchUser 已在 beforehand() 中 await 完成，此处无需再调

  // 记录站点访问（后端按 IP 每日去重）
  recordSiteVisit().catch(() => {})

  // 处理订阅验证/退订回调 query 参数
  const subscribeStatus = route.query.subscribe as string | undefined
  if (subscribeStatus) {
    const { t } = i18n.global
    const msgMap: Record<string, { type: 'success' | 'warning' | 'error'; key: string }> = {
      success: { type: 'success', key: 'subscribe.verifySuccess' },
      invalid: { type: 'error', key: 'subscribe.verifyInvalid' },
      unsubscribed: { type: 'success', key: 'subscribe.unsubscribed' },
    }
    const cfg = msgMap[subscribeStatus]
    if (cfg) {
      UMessageFn({ type: cfg.type, message: t(cfg.key) })
    }
    // 清理 URL query 参数
    const query = { ...route.query }
    delete query.subscribe
    router.replace({ path: route.path, query })
  }
})
</script>
