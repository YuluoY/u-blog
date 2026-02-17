<template>
  <LayoutBase>
    <RouterView />
  </LayoutBase>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import LayoutBase from '@/components/LayoutBase.vue'
import { useAppStore } from '@/stores/app'
import { i18n } from '@/locales'
import { getSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'

const appStore = useAppStore()

// 在组件上下文中监听 language 并同步到 i18n，确保 locale 变化触发整树重渲染
watch(
  () => appStore.language,
  (l) => {
    if (l) i18n.global.locale.value = l
  },
  { immediate: true }
)

// 应用启动时从服务端拉取外观设置并回填（主题、语言、列表样式）
onMounted(() => {
  getSettings([SETTING_KEYS.THEME, SETTING_KEYS.LANGUAGE, SETTING_KEYS.ARTICLE_LIST_TYPE])
    .then((data) => appStore.hydrateAppearance(data))
    .catch(() => {})
})
</script>
