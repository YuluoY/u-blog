<template>
  <Teleport to="body">
    <div
      v-show="visible"
      ref="popoverRef"
      class="popover-panel"
      role="dialog"
      aria-label="侧边面板"
      :style="popoverStyle"
      @keydown.esc="close"
    >
      <div class="popover-panel__inner">
        <ProfilePanel v-if="activePanel === PANEL_ID.PROFILE" />
        <CalendarPanel v-else-if="activePanel === PANEL_ID.CALENDAR" :on-close="close" />
        <SearchPanel v-else-if="activePanel === PANEL_ID.SEARCH" :on-close="close" />
        <TagsPanel v-else-if="activePanel === PANEL_ID.TAGS" />
        <SiteInfoPanel v-else-if="activePanel === PANEL_ID.SITE_INFO" />
      </div>
    </div>
    <!-- 遮罩不覆盖 icon bar，避免点其他 icon 时先触达 backdrop 导致需点两次 -->
    <div
      v-show="visible"
      class="popover-panel__backdrop"
      aria-hidden="true"
      :style="backdropStyle"
      @click="close"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import { PANEL_ID, ICON_BAR_WIDTH_PX } from '@/constants/layout'
import { pxToRem } from '@u-blog/utils'
import ProfilePanel from './ProfilePanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SearchPanel from './SearchPanel.vue'
import TagsPanel from './TagsPanel.vue'
import SiteInfoPanel from './SiteInfoPanel.vue'

defineOptions({ name: 'PopoverPanel' })

const sidebarStore = useSidebarStore()

const visible = computed(
  () => sidebarStore.collapsed && sidebarStore.activePanel != null
)
const activePanel = computed(() => sidebarStore.activePanel)
const popoverRef = ref<HTMLElement | null>(null)

const popoverStyle = computed(() => ({
  width: pxToRem(320),
  maxHeight: '70vh',
}))

const backdropStyle = { left: `${ICON_BAR_WIDTH_PX}px` }

function close() {
  sidebarStore.closePanel()
}

/**
 * 定位 Popover：锚定到当前激活 icon 按钮的右侧。
 * 找 .is-active 按钮的位置；如果面板内容过高则往上偏移，不超出视口。
 */
function positionPopover() {
  const el = popoverRef.value
  if (!el) return

  const bar = document.querySelector('.icon-bar') as HTMLElement | null
  /** 找到当前激活的 icon 按钮 */
  const activeBtn = document.querySelector('.icon-bar__item.is-active') as HTMLElement | null
  if (!bar) return

  const barRect = bar.getBoundingClientRect()
  const left = barRect.right + 8

  if (activeBtn) {
    const btnRect = activeBtn.getBoundingClientRect()
    /** Popover 顶部对齐到按钮中心 - Popover 高度一半，但不超出视口 */
    const top = Math.max(8, Math.min(btnRect.top, window.innerHeight - el.offsetHeight - 8))
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  } else {
    el.style.left = `${left}px`
    el.style.top = `${barRect.top}px`
  }
}

/** visible 变化、activePanel 切换时都重新定位 */
watch(visible, (v) => {
  if (v) nextTick(positionPopover)
})
watch(activePanel, () => {
  if (visible.value) nextTick(positionPopover)
})
</script>

<style lang="scss" scoped>
/* 高于 icon-bar(10002)，避免遮挡时误触；backdrop 10001 低于 icon-bar 以便点击折叠/面板 */
.popover-panel {
  position: fixed;
  z-index: 10003;
  background: var(--u-background-1);
  border-radius: 8px;
  box-shadow: var(--u-shadow-2);
  border: 1px solid var(--u-border-1);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__inner {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    max-height: 70vh;
  }
}

.popover-panel__backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  /* left 由 :style="backdropStyle" 注入，不覆盖 icon bar */
  z-index: 10001;
  background: transparent;
}
</style>
