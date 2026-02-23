<template>
  <!--
    移动端底部导航栏（≤767px 可见）
    替代被隐藏的 IconBar，提供核心工具入口：
    首页 / 搜索 / 分类标签 / 主题切换 / 更多
  -->
  <nav class="mobile-nav" role="navigation" :aria-label="t('sidebar.ariaTools')">
    <!-- 首页 -->
    <router-link to="/home" class="mobile-nav__item" :class="{ 'is-active': route.path === '/home' }">
      <u-icon icon="fa-solid fa-house" />
      <span class="mobile-nav__label">{{ t('nav.home') }}</span>
    </router-link>

    <!-- 搜索 -->
    <button class="mobile-nav__item" @click="handleSearch">
      <u-icon icon="fa-solid fa-magnifying-glass" />
      <span class="mobile-nav__label">{{ t('sidebar.search') }}</span>
    </button>

    <!-- 分类标签 -->
    <button class="mobile-nav__item" @click="handleTags">
      <u-icon icon="fa-solid fa-tags" />
      <span class="mobile-nav__label">{{ t('sidebar.categoriesAndTags') }}</span>
    </button>

    <!-- 主题切换 -->
    <button class="mobile-nav__item" @click="appStore.toggleTheme($event)">
      <u-icon :icon="isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'" />
      <span class="mobile-nav__label">{{ isDark ? t('sidebar.themeLight') : t('sidebar.themeDark') }}</span>
    </button>

    <!-- 更多 (设置) -->
    <button class="mobile-nav__item" @click="appStore.setSettingsDrawerVisible(true)">
      <u-icon icon="fa-solid fa-ellipsis" />
      <span class="mobile-nav__label">{{ t('sidebar.settings') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useSidebarStore } from '@/stores/sidebar'
import { PANEL_ID } from '@/constants/layout'
import { CTheme } from '@u-blog/model'

defineOptions({ name: 'MobileBottomNav' })

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const sidebarStore = useSidebarStore()
const { theme } = storeToRefs(appStore)

const isDark = computed(() => String(theme.value ?? '') === CTheme.DARK)

/** 打开搜索面板（确保走 Popover 模式） */
function handleSearch() {
  // 移动端 SidePanel 被隐藏，需要确保 collapsed=true 以走 PopoverPanel 路径
  if (!sidebarStore.collapsed) {
    sidebarStore.setCollapsed(true)
  }
  sidebarStore.setActivePanel(PANEL_ID.SEARCH)
}

/** 打开分类标签面板 */
function handleTags() {
  if (!sidebarStore.collapsed) {
    sidebarStore.setCollapsed(true)
  }
  sidebarStore.setActivePanel(PANEL_ID.TAGS)
}
</script>

<style lang="scss" scoped>
/* 仅在 ≤767px 显示 */
.mobile-nav {
  display: none;
}

@media (max-width: 767px) {
  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10002;
    height: 56px;
    align-items: center;
    justify-content: space-around;
    padding: 0 4px;
    padding-bottom: env(safe-area-inset-bottom, 0);
    /* 毛玻璃效果 */
    background: rgba(var(--u-background-1-rgb, 255, 255, 255), 0.82);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-top: 0.5px solid var(--u-border-1);

    &__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex: 1;
      height: 100%;
      padding: 4px 0;
      border: none;
      background: none;
      color: var(--u-text-3);
      font-size: 18px;
      cursor: pointer;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      transition: color 0.15s ease;

      &:active {
        opacity: 0.6;
      }

      &.is-active,
      &.router-link-active {
        color: var(--u-primary);
      }
    }

    &__label {
      font-size: 10px;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 64px;
    }
  }
}

/* 暗色主题下调整毛玻璃背景 */
:root.dark .mobile-nav {
  background: rgba(var(--u-background-1-rgb, 30, 30, 30), 0.82);
}
</style>
