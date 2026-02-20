<template>
  <aside class="icon-bar" role="navigation" :aria-label="t('sidebar.ariaTools')" :style="barStyle">
    <!-- 顶部：折叠/展开 -->
    <div class="icon-bar__top">
      <u-tooltip
        :content="isPanelVisible ? t('sidebar.collapse') : t('sidebar.expand')"
        placement="right"
        trigger="hover"
        :width="0"
        show-arrow
      >
        <u-button
          class="icon-bar__item"
          circle
          :aria-label="isPanelVisible ? t('sidebar.collapseSidebar') : t('sidebar.expandSidebar')"
          :icon="isPanelVisible ? 'fa-solid fa-angles-left' : 'fa-solid fa-angles-right'"
          :icon-props="{ icon: '', size: 'md' }"
          @click="sidebarStore.toggleCollapsed()"
        />
      </u-tooltip>
    </div>

    <div class="icon-bar__divider" />

    <!-- 面板型工具入口 -->
    <div class="icon-bar__tools">
      <u-tooltip :content="t('sidebar.profile')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.PROFILE }"
          circle
          :aria-label="t('sidebar.profile')"
          icon="fa-solid fa-user"
          :icon-props="{ icon: '', size: 'md' }"
          @click="toggle(PANEL_ID.PROFILE)"
        />
      </u-tooltip>
      <u-tooltip :content="t('sidebar.calendar')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.CALENDAR }"
          circle
          :aria-label="t('sidebar.calendar')"
          icon="fa-solid fa-calendar-days"
          :icon-props="{ icon: '', size: 'md' }"
          @click="toggle(PANEL_ID.CALENDAR)"
        />
      </u-tooltip>
      <u-tooltip :content="t('sidebar.search')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SEARCH }"
          circle
          :aria-label="t('sidebar.search')"
          icon="fa-solid fa-magnifying-glass"
          :icon-props="{ icon: '', size: 'md' }"
          @click="toggle(PANEL_ID.SEARCH)"
        />
      </u-tooltip>
      <u-tooltip :content="t('sidebar.categoriesAndTags')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.TAGS }"
          circle
          :aria-label="t('sidebar.categoriesAndTags')"
          icon="fa-solid fa-tags"
          :icon-props="{ icon: '', size: 'md' }"
          @click="toggle(PANEL_ID.TAGS)"
        />
      </u-tooltip>
      <u-tooltip :content="t('sidebar.siteInfo')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          :class="{ 'is-active': sidebarStore.activePanel === PANEL_ID.SITE_INFO }"
          circle
          :aria-label="t('sidebar.siteInfo')"
          icon="fa-solid fa-chart-simple"
          :icon-props="{ icon: '', size: 'md' }"
          @click="toggle(PANEL_ID.SITE_INFO)"
        />
      </u-tooltip>
    </div>

    <div class="icon-bar__divider" />

    <!-- 底部：语言切换 + 主题切换 -->
    <div class="icon-bar__bottom">
      <u-tooltip :content="t('sidebar.langSwitch')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          circle
          :aria-label="t('sidebar.langSwitchAria')"
          @click="toggleLanguage"
        >
          <u-text class="icon-bar__lang-text">{{ language === CLanguage.EN ? '中' : 'En' }}</u-text>
        </u-button>
      </u-tooltip>
      <u-tooltip
        :content="isDark ? t('sidebar.themeLight') : t('sidebar.themeDark')"
        placement="right"
        trigger="hover"
        :width="0"
        show-arrow
      >
        <u-button
          class="icon-bar__item"
          circle
          :aria-label="isDark ? t('sidebar.themeLightAria') : t('sidebar.themeDarkAria')"
          :icon="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"
          :icon-props="{ icon: '', size: 'md' }"
          @click="appStore.toggleTheme($event)"
        />
      </u-tooltip>
      <u-tooltip :content="t('sidebar.settings')" placement="right" trigger="hover" :width="0" show-arrow>
        <u-button
          class="icon-bar__item"
          circle
          :aria-label="t('sidebar.settings')"
          icon="fa-solid fa-gear"
          :icon-props="{ icon: '', size: 'md' }"
          @click="appStore.setSettingsDrawerVisible(true)"
        />
      </u-tooltip>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
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
const { language, theme } = storeToRefs(appStore)

const isDark = computed(() => String(theme.value ?? '') === CTheme.DARK)

function toggle(id: PanelId) {
  sidebarStore.setActivePanel(id)
}

function toggleLanguage() {
  const next = language.value === CLanguage.EN ? CLanguage.ZH : CLanguage.EN
  appStore.setLanguage(next)
}

/** 侧栏内容（dock 面板）是否可见：未折叠且有激活面板时为 true；折叠或无面板时为 false，折叠按钮显示“展开” */
const isPanelVisible = computed(
  () => !sidebarStore.collapsed && sidebarStore.activePanel != null
)

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

  /* UButton 用作 ghost 图标按钮：无边框透明底，hover 微弱底色，active 蓝色 + 左侧指示条 */
  &__item.u-button {
    position: relative;
    width: 44px;
    height: 44px;
    min-width: 44px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--u-text-3);
    transition: background 0.15s, color 0.15s;

    &:hover:not(.is-disabled) {
      background: var(--u-background-2);
      color: var(--u-text-1);
      border-color: transparent;
    }

    &:focus-visible {
      outline: 2px solid var(--u-primary-0);
      outline-offset: -2px;
    }

    &.is-active {
      color: var(--u-primary-0);
      background: var(--u-primary-light-7);
      border-color: transparent;
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
