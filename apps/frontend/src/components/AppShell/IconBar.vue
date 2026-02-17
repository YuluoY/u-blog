<template>
  <aside class="icon-bar" role="navigation" :aria-label="t('sidebar.ariaTools')" :style="barStyle">
    <!-- 顶部：折叠/展开 -->
    <div class="icon-bar__top">
      <u-tooltip
        :content="sidebarStore.collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        placement="right"
        trigger="hover"
        :width="0"
        show-arrow
      >
        <button
          type="button"
          class="icon-bar__item"
          :aria-label="sidebarStore.collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')"
          @click="sidebarStore.toggleCollapsed()"
        >
          <u-icon
            :icon="sidebarStore.collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"
            size="lg"
          />
        </button>
      </u-tooltip>
    </div>

    <div class="icon-bar__divider" />

    <!-- 面板型工具入口 -->
    <div class="icon-bar__tools">
      <u-tooltip :content="t('sidebar.profile')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.PROFILE }"
          :aria-label="t('sidebar.profile')"
          @click="toggle(PANEL_ID.PROFILE)"
        >
          <u-icon icon="fa-solid fa-user" size="lg" />
        </button>
      </u-tooltip>
      <u-tooltip :content="t('sidebar.calendar')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.CALENDAR }"
          :aria-label="t('sidebar.calendar')"
          @click="toggle(PANEL_ID.CALENDAR)"
        >
          <u-icon icon="fa-solid fa-calendar-days" size="lg" />
        </button>
      </u-tooltip>
      <u-tooltip :content="t('sidebar.search')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SEARCH }"
          :aria-label="t('sidebar.search')"
          @click="toggle(PANEL_ID.SEARCH)"
        >
          <u-icon icon="fa-solid fa-magnifying-glass" size="lg" />
        </button>
      </u-tooltip>
      <u-tooltip :content="t('sidebar.tags')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.TAGS }"
          :aria-label="t('sidebar.tags')"
          @click="toggle(PANEL_ID.TAGS)"
        >
          <u-icon icon="fa-solid fa-tags" size="lg" />
        </button>
      </u-tooltip>
      <u-tooltip :content="t('sidebar.siteInfo')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SITE_INFO }"
          :aria-label="t('sidebar.siteInfo')"
          @click="toggle(PANEL_ID.SITE_INFO)"
        >
          <u-icon icon="fa-solid fa-chart-simple" size="lg" />
        </button>
      </u-tooltip>
    </div>

    <div class="icon-bar__divider" />

    <!-- 底部：语言切换 + 主题切换 -->
    <div class="icon-bar__bottom">
      <u-tooltip :content="t('sidebar.langSwitch')" placement="right" trigger="hover" :width="0" show-arrow>
        <button
          type="button"
          class="icon-bar__item"
          :aria-label="t('sidebar.langSwitchAria')"
          @click="toggleLanguage"
        >
          <u-text class="icon-bar__lang-text">{{ appStore.language === 'en' ? '中' : 'En' }}</u-text>
        </button>
      </u-tooltip>
      <u-tooltip
        :content="isDark ? t('sidebar.themeLight') : t('sidebar.themeDark')"
        placement="right"
        trigger="hover"
        :width="0"
        show-arrow
      >
        <button
          type="button"
          class="icon-bar__item"
          :aria-label="isDark ? t('sidebar.themeLightAria') : t('sidebar.themeDarkAria')"
          @click="appStore.toggleTheme($event)"
        >
          <u-icon :icon="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" size="lg" />
        </button>
      </u-tooltip>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSidebarStore } from '@/stores/sidebar'
import { useAppStore } from '@/stores/app'
import { PANEL_ID, ICON_BAR_WIDTH_PX } from '@/constants/layout'
import { CTheme, CLanguage } from '@u-blog/model'
import { pxToRem } from '@u-blog/utils'
import type { PanelId } from '@/constants/layout'

defineOptions({ name: 'IconBar' })

const { t } = useI18n({ useScope: 'global' })
const sidebarStore = useSidebarStore()
const appStore = useAppStore()

const isDark = computed(() => appStore.theme === CTheme.DARK)

function toggle(id: PanelId) {
  sidebarStore.setActivePanel(id)
}

function toggleLanguage() {
  appStore.setLanguage(appStore.language === CLanguage.EN ? CLanguage.ZH : CLanguage.EN)
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

  /* UTooltip 包裹按钮时保持 44px 居中，不因 inline-flex 破坏布局 */
  :deep(.u-tooltip) {
    display: flex;
    width: 100%;
    justify-content: center;
  }
  :deep(.u-tooltip__trigger) {
    display: flex;
    justify-content: center;
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

  /* 左侧中英切换：覆盖 UText 默认色，与其它 icon 一致为 text-3 */
  :deep(.icon-bar__lang-text) {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--u-text-3);
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
