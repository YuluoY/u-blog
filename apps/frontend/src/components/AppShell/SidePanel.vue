<template>
  <aside
    v-show="isVisible"
    class="side-panel"
    role="complementary"
    :aria-label="panelTitle"
    :style="panelStyle"
  >
    <div class="side-panel__inner">
      <ProfilePanel v-if="sidebarStore.activePanel === PANEL_ID.PROFILE" />
      <CalendarPanel v-else-if="sidebarStore.activePanel === PANEL_ID.CALENDAR" />
      <SearchPanel v-else-if="sidebarStore.activePanel === PANEL_ID.SEARCH" />
      <TagsPanel v-else-if="sidebarStore.activePanel === PANEL_ID.TAGS" />
      <SiteInfoPanel v-else-if="sidebarStore.activePanel === PANEL_ID.SITE_INFO" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSidebarStore } from '@/stores/sidebar'
import { PANEL_ID, SIDE_PANEL_WIDTH_PX } from '@/constants/layout'
import { pxToRem } from '@u-blog/utils'
import ProfilePanel from './ProfilePanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SearchPanel from './SearchPanel.vue'
import TagsPanel from './TagsPanel.vue'
import SiteInfoPanel from './SiteInfoPanel.vue'

defineOptions({ name: 'SidePanel' })

const { t } = useI18n()
const sidebarStore = useSidebarStore()

const isVisible = computed(
  () => !sidebarStore.collapsed && sidebarStore.activePanel != null
)

const panelTitle = computed(() => {
  const keyMap: Record<string, string> = {
    [PANEL_ID.PROFILE]: 'sidebar.profile',
    [PANEL_ID.CALENDAR]: 'sidebar.calendar',
    [PANEL_ID.SEARCH]: 'sidebar.search',
    [PANEL_ID.TAGS]: 'sidebar.tags',
    [PANEL_ID.SITE_INFO]: 'sidebar.siteInfo',
  }
  const key = keyMap[sidebarStore.activePanel ?? '']
  return key ? t(key) : t('sidebar.sidePanel')
})

const panelStyle = computed(() => ({
  width: pxToRem(SIDE_PANEL_WIDTH_PX),
  minWidth: pxToRem(SIDE_PANEL_WIDTH_PX),
}))
</script>

<style lang="scss" scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--u-background-1);
  border-right: 1px solid var(--u-border-1);
  overflow: hidden;
  z-index: 8;

  &__inner {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }
}
</style>
