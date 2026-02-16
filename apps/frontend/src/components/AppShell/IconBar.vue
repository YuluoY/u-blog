<template>
  <aside class="icon-bar" role="navigation" aria-label="侧边栏工具" :style="barStyle">
    <!-- 顶部：折叠/展开 -->
    <div class="icon-bar__top">
      <button
        type="button"
        class="icon-bar__item"
        :aria-label="sidebarStore.collapsed ? '展开侧边栏' : '折叠侧边栏'"
        :title="sidebarStore.collapsed ? '展开' : '折叠'"
        @click="sidebarStore.toggleCollapsed()"
      >
        <u-icon
          :icon="sidebarStore.collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"
          size="lg"
        />
      </button>
    </div>

    <div class="icon-bar__divider" />

    <!-- 面板型工具入口 -->
    <div class="icon-bar__tools">
      <!-- 用户/站长信息 -->
      <button
        type="button"
        class="icon-bar__item"
        :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.PROFILE }"
        title="站长信息"
        aria-label="站长信息"
        @click="toggle(PANEL_ID.PROFILE)"
      >
        <u-icon icon="fa-solid fa-user" size="lg" />
      </button>
      <!-- 发布记录 -->
      <button
        type="button"
        class="icon-bar__item"
        :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.CALENDAR }"
        title="发布记录"
        aria-label="发布记录"
        @click="toggle(PANEL_ID.CALENDAR)"
      >
        <u-icon icon="fa-solid fa-calendar-days" size="lg" />
      </button>
      <!-- 搜索 -->
      <button
        type="button"
        class="icon-bar__item"
        :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SEARCH }"
        title="搜索"
        aria-label="搜索"
        @click="toggle(PANEL_ID.SEARCH)"
      >
        <u-icon icon="fa-solid fa-magnifying-glass" size="lg" />
      </button>
      <!-- 标签云 -->
      <button
        type="button"
        class="icon-bar__item"
        :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.TAGS }"
        title="标签"
        aria-label="标签"
        @click="toggle(PANEL_ID.TAGS)"
      >
        <u-icon icon="fa-solid fa-tags" size="lg" />
      </button>
      <!-- 网站信息 -->
      <button
        type="button"
        class="icon-bar__item"
        :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SITE_INFO }"
        title="网站信息"
        aria-label="网站信息"
        @click="toggle(PANEL_ID.SITE_INFO)"
      >
        <u-icon icon="fa-solid fa-chart-simple" size="lg" />
      </button>
    </div>

    <div class="icon-bar__divider" />

    <!-- 底部：主题切换 -->
    <div class="icon-bar__bottom">
      <!-- 主题切换（圆形扩散动画） -->
      <button
        type="button"
        class="icon-bar__item"
        :title="isDark ? '切换亮色' : '切换暗色'"
        :aria-label="isDark ? '切换亮色主题' : '切换暗色主题'"
        @click="appStore.toggleTheme($event)"
      >
        <u-icon :icon="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" size="lg" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import { useAppStore } from '@/stores/app'
import { PANEL_ID, ICON_BAR_WIDTH_PX } from '@/constants/layout'
import { CTheme } from '@u-blog/model'
import { pxToRem } from '@u-blog/utils'
import type { PanelId } from '@/constants/layout'

defineOptions({ name: 'IconBar' })

const sidebarStore = useSidebarStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === CTheme.DARK)

function toggle(id: PanelId) {
  sidebarStore.setActivePanel(id)
}

const barStyle = computed(() => ({
  width: pxToRem(ICON_BAR_WIDTH_PX),
  minWidth: pxToRem(ICON_BAR_WIDTH_PX),
}))
</script>

<style lang="scss" scoped>
/* 高于 backdrop(10001)，保证折叠/展开与面板 icon 在 popover 打开时仍可点击 */
.icon-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 4px;
  background: var(--u-background-1);
  border-right: 1px solid var(--u-border-1);
  flex-shrink: 0;
  z-index: 10002;

  &__top,
  &__tools,
  &__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__bottom {
    margin-top: auto;
  }

  &__divider {
    width: 24px;
    height: 1px;
    background: var(--u-border-1);
    margin: 4px 0;
  }

  /* ghost icon：无边框透明底，hover 微弱底色，active 蓝色 + 左侧指示条 */
  &__item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--u-text-3);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover:not(.is-disabled) {
      background: var(--u-background-2);
      color: var(--u-text-1);
    }

    &:focus-visible {
      outline: 2px solid var(--u-primary-0);
      outline-offset: -2px;
    }

    &.is-active {
      color: var(--u-primary-0);
      background: var(--u-primary-light-7);
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: var(--u-primary-0);
      }
    }

    &.is-disabled {
      color: var(--u-text-4);
      cursor: not-allowed;
    }
  }
}
</style>
