<template>
  <!--
    移动端底部导航栏（≤767px 可见）
    替代被隐藏的 IconBar，提供核心工具入口：
    首页 / 搜索 / 分类标签 / 主题切换 / 更多
  -->
  <nav class="mobile-nav" role="navigation" :aria-label="t('sidebar.ariaTools')">
    <!-- 返回按钮：在文章阅读页等子页面显示 -->
    <button v-if="showBack" class="mobile-nav__item" @click="handleBack">
      <u-icon icon="fa-solid fa-arrow-left" />
      <span class="mobile-nav__label">{{ t('common.back') }}</span>
    </button>

    <!-- 目录按钮：仅在阅读页且文章有标题时显示 -->
    <button
      v-if="showTocBtn"
      class="mobile-nav__item"
      @click="handleOpenToc"
    >
      <u-icon icon="fa-solid fa-list-ul" />
      <span class="mobile-nav__label">{{ t('read.catalog') }}</span>
    </button>

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

    <!--
      当有"查看后台"入口时显示"更多"弹出菜单；
      否则直接作为"设置"按钮，省去多余的弹出步骤
    -->
    <button v-if="guestAdminVisible" class="mobile-nav__item" @click="toggleMoreMenu">
      <u-icon icon="fa-solid fa-ellipsis" />
      <span class="mobile-nav__label">{{ t('common.more') }}</span>
    </button>
    <button v-else class="mobile-nav__item" @click="appStore.setSettingsDrawerVisible(true)">
      <u-icon icon="fa-solid fa-gear" />
      <span class="mobile-nav__label">{{ t('sidebar.settings') }}</span>
    </button>

    <!-- 更多菜单弹窗（仅 guestAdminVisible 时可能弹出） -->
    <Transition name="mobile-menu-fade">
      <div v-if="moreMenuOpen" class="mobile-more-backdrop" @click="moreMenuOpen = false" />
    </Transition>
    <Transition name="mobile-menu-slide">
      <div v-if="moreMenuOpen" class="mobile-more-menu">
        <!-- 查看后台 -->
        <button class="mobile-more-menu__item" @click="handleOpenAdmin">
          <u-icon icon="fa-solid fa-eye" />
          <span>{{ t('guestAdmin.label') }}</span>
        </button>
        <!-- 设置 -->
        <button class="mobile-more-menu__item" @click="handleOpenSettings">
          <u-icon icon="fa-solid fa-gear" />
          <span>{{ t('sidebar.settings') }}</span>
        </button>
      </div>
    </Transition>

    <!-- 移动端目录底部抽屉 -->
    <MobileTocSheet />
  </nav>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useSidebarStore } from '@/stores/sidebar'
import { useGuestAdmin } from '@/composables/useGuestAdmin'
import { PANEL_ID } from '@/constants/layout'
import { CTheme } from '@u-blog/model'
import { useMobileToc } from '@/composables/useMobileToc'
import MobileTocSheet from '@/components/MobileTocSheet.vue'

defineOptions({ name: 'MobileBottomNav' })

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const sidebarStore = useSidebarStore()
const { theme } = storeToRefs(appStore)

const isDark = computed(() => String(theme.value ?? '') === CTheme.DARK)

/** 是否显示返回按钮（文章阅读页、撰写页等子页面） */
const showBack = computed(() => /^\/(read|write)\//.test(route.path) || route.path === '/write')

/* ---- 移动端目录 ---- */
const tocCtx = useMobileToc()
/** 是否显示目录按钮：阅读页 + 文章有标题 */
const showTocBtn = computed(() =>
{
  return /^\/read\//.test(route.path) && tocCtx.hasHeadings.value === true
})
/** 打开目录抽屉 */
function handleOpenToc()
{
  tocCtx.sheetVisible.value = true
}

/** 返回上一页，无历史时回首页 */
function handleBack()
{
  if (window.history.length > 1)
  
    router.back()
  
  else
  
    router.push('/home')
  
}

/* 游客查看后台 */
const { visible: guestAdminVisible, openAdmin } = useGuestAdmin()

/* 更多菜单开关 */
const moreMenuOpen = ref(false)

function toggleMoreMenu()
{
  moreMenuOpen.value = !moreMenuOpen.value
}

function handleOpenAdmin()
{
  moreMenuOpen.value = false
  openAdmin()
}

function handleOpenSettings()
{
  moreMenuOpen.value = false
  appStore.setSettingsDrawerVisible(true)
}

/** 打开搜索面板（确保走 Popover 模式） */
function handleSearch()
{
  // 移动端 SidePanel 被隐藏，需要确保 collapsed=true 以走 PopoverPanel 路径
  if (!sidebarStore.collapsed)
  
    sidebarStore.setCollapsed(true)
  
  sidebarStore.setActivePanel(PANEL_ID.SEARCH)
}

/** 打开分类标签面板 */
function handleTags()
{
  if (!sidebarStore.collapsed)
  
    sidebarStore.setCollapsed(true)
  
  sidebarStore.setActivePanel(PANEL_ID.TAGS)
}

/** 路由变化时自动关闭弹出面板（分类/搜索 Popover），仅移动端生效 */
watch(() => route.path, () =>
{
  // 桌面端侧栏面板不应被路由变化关闭
  if (window.innerWidth > 767) return
  sidebarStore.closePanel()
  moreMenuOpen.value = false
})
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

/* ---- 更多菜单弹窗 ---- */

/* 遮罩层 */
.mobile-more-backdrop {
  display: none;
}

@media (max-width: 767px) {
  .mobile-more-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 10003;
    background: rgba(0, 0, 0, 0.3);
    -webkit-tap-highlight-color: transparent;
  }

  /* 弹出菜单：固定在底部导航栏正上方 */
  .mobile-more-menu {
    position: fixed;
    right: 8px;
    bottom: calc(56px + env(safe-area-inset-bottom, 0) + 8px);
    z-index: 10004;
    min-width: 160px;
    padding: 6px 0;
    border-radius: 12px;
    background: var(--u-background-1);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    border: 0.5px solid var(--u-border-1);

    &__item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      color: var(--u-text-1);
      font-size: 14px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;

      &:active {
        background: var(--u-background-2);
      }
    }
  }
}

/* 遮罩渐现动画 */
.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.2s ease;
}
.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
}

/* 菜单滑入动画 */
.mobile-menu-slide-enter-active,
.mobile-menu-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mobile-menu-slide-enter-from,
.mobile-menu-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 暗色主题阴影加深 */
:root.dark .mobile-more-menu {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
}
</style>
