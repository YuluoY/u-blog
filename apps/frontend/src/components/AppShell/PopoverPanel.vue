<template>
  <Teleport to="body">
    <div
      v-show="visible"
      ref="popoverRef"
      class="popover-panel"
      role="dialog"
      :aria-label="t('popover.sidePanel')"
      :style="popoverStyle"
      @keydown.esc="close"
    >
      <div class="popover-panel__inner">
        <ProfilePanel v-if="activePanel === PANEL_ID.PROFILE" />
        <CalendarPanel v-else-if="activePanel === PANEL_ID.CALENDAR" :on-close="close" />
        <SearchPanel v-else-if="activePanel === PANEL_ID.SEARCH" ref="searchPanelRef" :on-close="close" />
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
import { nextTick, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSidebarStore } from '@/stores/sidebar'
import { PANEL_ID, ICON_BAR_WIDTH_PX } from '@/constants/layout'
import { pxToRem } from '@u-blog/utils'
import ProfilePanel from './ProfilePanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SearchPanel from './SearchPanel.vue'
import TagsPanel from './TagsPanel.vue'
import SiteInfoPanel from './SiteInfoPanel.vue'

defineOptions({ name: 'PopoverPanel' })

const { t } = useI18n()

const sidebarStore = useSidebarStore()

const visible = computed(
  () => sidebarStore.collapsed && sidebarStore.activePanel != null
)
const activePanel = computed(() => sidebarStore.activePanel)
const popoverRef = ref<HTMLElement | null>(null)
const searchPanelRef = ref<InstanceType<typeof SearchPanel> | null>(null)
/** 根据定位后的可用视口高度动态设置，避免上方空间足够时仍被 70vh 限制出现内部滚动 */
const panelMaxHeightPx = ref<number | null>(null)
/** 首帧即设好位置，避免先出现在文档底部再跳到目标位（产生“从下方滑上去”的观感） */
const panelPosition = ref<{ left: number; top: number } | null>(null)

/** 面板高度上限（70vh），避免整屏；实际高度取「可用空间」与此上限的较小值，以便内部列表能自适应剩余高度后滚动 */
const PANEL_HEIGHT_CAP_RATIO = 0.7

const popoverStyle = computed(() => {
  const capPx = Math.floor(window.innerHeight * PANEL_HEIGHT_CAP_RATIO)
  const heightPx = panelMaxHeightPx.value != null
    ? Math.min(panelMaxHeightPx.value, capPx)
    : capPx
  return {
    width: pxToRem(320),
    height: `${heightPx}px`,
    maxHeight: `${heightPx}px`,
    ...(panelPosition.value != null
      ? { left: `${panelPosition.value.left}px`, top: `${panelPosition.value.top}px` }
      : {}),
  }
})

const backdropStyle = { left: `${ICON_BAR_WIDTH_PX}px` }

function close() {
  sidebarStore.closePanel()
}

const MARGIN_EDGE = 8
/** 视口内面板允许的最大高度 */
const maxAllowedHeight = () => window.innerHeight - MARGIN_EDGE * 2

/**
 * 定位 Popover：锚定到当前激活 icon 按钮的右侧。
 * 根据上方/下方可用空间与面板实际高度智能选择放在按钮上方或下方，保证整块在视口内；
 * 面板高度变化时（如内容异步加载）由 ResizeObserver 重新定位。
 */
function positionPopover() {
  const el = popoverRef.value
  if (!el) return

  const bar = document.querySelector('.icon-bar') as HTMLElement | null
  const activeBtn = document.querySelector('.icon-bar__item.is-active') as HTMLElement | null
  if (!bar) return

  const barRect = bar.getBoundingClientRect()
  const left = barRect.right + 8
  const vh = window.innerHeight
  const panelHeight = el.offsetHeight
  const maxH = maxAllowedHeight()

  if (activeBtn) {
    const btnRect = activeBtn.getBoundingClientRect()
    const spaceAbove = btnRect.top - MARGIN_EDGE
    const spaceBelow = vh - btnRect.bottom - MARGIN_EDGE

    let top: number
    let maxHeightPx: number

    if (panelHeight > maxH) {
      // 面板超高，顶边贴视口顶，用 maxHeight 限制并内部滚动
      top = MARGIN_EDGE
      maxHeightPx = maxH
    } else {
      const fitsBelow = spaceBelow >= panelHeight
      const fitsAbove = spaceAbove >= panelHeight
      if (fitsBelow && !fitsAbove) {
        top = btnRect.top
        maxHeightPx = vh - top - MARGIN_EDGE
      } else if (fitsAbove && !fitsBelow) {
        // 放在按钮上方：面板底边在按钮上缘上方 MARGIN_EDGE
        top = Math.max(MARGIN_EDGE, btnRect.top - panelHeight - MARGIN_EDGE)
        maxHeightPx = Math.min(btnRect.top - MARGIN_EDGE - top, vh - MARGIN_EDGE - top)
      } else if (fitsAbove && fitsBelow) {
        // 上下都放得下：上方空间更大时放上方，否则放下方
        if (spaceAbove >= spaceBelow) {
          top = Math.max(MARGIN_EDGE, btnRect.top - panelHeight - MARGIN_EDGE)
          maxHeightPx = Math.min(btnRect.top - MARGIN_EDGE - top, vh - MARGIN_EDGE - top)
        } else {
          top = btnRect.top
          maxHeightPx = vh - top - MARGIN_EDGE
        }
      } else {
        // 上下都不够完整放下：选空间大的一侧，用 maxHeight 限制
        top = spaceAbove >= spaceBelow ? MARGIN_EDGE : Math.max(MARGIN_EDGE, vh - MARGIN_EDGE - panelHeight)
        maxHeightPx = maxH
      }
    }

    panelPosition.value = { left, top }
    panelMaxHeightPx.value = maxHeightPx
  } else {
    const top = Math.max(MARGIN_EDGE, Math.min(barRect.top, vh - panelHeight - MARGIN_EDGE))
    panelPosition.value = { left, top }
    panelMaxHeightPx.value = vh - top - MARGIN_EDGE
  }
}

/** 打开时同步算出位置与可用高度，首帧即用正确 left/top/maxHeight，避免先出现在底部再“滑上去” */
function setInitialPositionAndHeight() {
  const bar = document.querySelector('.icon-bar') as HTMLElement | null
  const activeBtn = document.querySelector('.icon-bar__item.is-active') as HTMLElement | null
  const vh = window.innerHeight
  if (!bar) {
    panelPosition.value = { left: MARGIN_EDGE, top: MARGIN_EDGE }
    panelMaxHeightPx.value = vh - MARGIN_EDGE * 2
    return
  }
  const barRect = bar.getBoundingClientRect()
  const left = barRect.right + 8
  if (activeBtn) {
    const btnRect = activeBtn.getBoundingClientRect()
    const top = Math.max(MARGIN_EDGE, Math.min(btnRect.top, vh - MARGIN_EDGE))
    panelPosition.value = { left, top }
    panelMaxHeightPx.value = vh - top - MARGIN_EDGE
  } else {
    const top = Math.max(MARGIN_EDGE, barRect.top)
    panelPosition.value = { left, top }
    panelMaxHeightPx.value = vh - top - MARGIN_EDGE
  }
}

/** visible 变化、activePanel 切换时都重新定位。sync 保证在首帧渲染前就写好 left/top，避免先出现在文档底部再“滑上去” */
watch(visible, (v) => {
  if (!v) {
    panelMaxHeightPx.value = null
    panelPosition.value = null
  } else {
    setInitialPositionAndHeight()
    nextTick(() => {
      positionPopover()
      if (activePanel.value === PANEL_ID.SEARCH) searchPanelRef.value?.focusInput?.()
    })
  }
}, { flush: 'sync' })
watch(activePanel, (panel) => {
  if (visible.value) nextTick(positionPopover)
  if (panel === PANEL_ID.SEARCH) nextTick(() => searchPanelRef.value?.focusInput?.())
})

// 内容高度变化（如 Tags 异步加载）时重新定位，保证始终在视口内
let resizeObserver: ResizeObserver | null = null
watch([visible, popoverRef], ([v, ref]) => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (v && ref) {
    resizeObserver = new ResizeObserver(() => positionPopover())
    resizeObserver.observe(ref)
  }
}, { flush: 'sync' })
onUnmounted(() => {
  resizeObserver?.disconnect()
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
  /* 禁用所有过渡，覆盖主题 --u-transition 等，弹框以最终位置与尺寸直接呈现 */
  transition: none !important;
  transform: none;

  &__inner {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    transition: none;
    /* 搜索面板：仅内部列表 __result 滚动；分类/标签等面板内容过长时由本容器滚动，避免截断 */
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
