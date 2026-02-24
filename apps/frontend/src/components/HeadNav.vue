<template>
  <header class="head-nav" :style="{ height: navHeight }">
    <!-- 左：Logo + 站点名 -->
    <div class="head-nav__brand" @click="router.push('/')">
      <!-- 有 logo URL 时显示图片，否则显示 SVG 图标 -->
      <img v-if="logo" class="head-nav__logo" :src="logo" alt="" />
      <span v-else class="head-nav__logo-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <u-text class="head-nav__site-name" :ellipsis="true">{{ siteName }}</u-text>
    </div>
    <!-- 中：路由导航 -->
    <nav class="head-nav__nav" :aria-label="t('headNav.ariaMainNav')">
      <u-menu>
        <template v-for="r in visibleRoutes" :key="r.path">
          <u-sub-menu v-if="r.children?.length">
            <template #title>
              <u-text>{{ navTitle(r) }}</u-text>
            </template>
            <u-menu-item v-for="c in r.children" :key="c.path" :route="c.path">
              <u-text>{{ navTitle(c) }}</u-text>
            </u-menu-item>
          </u-sub-menu>
          <u-menu-item v-else :route="r.path">
            <u-text>{{ navTitle(r) }}</u-text>
          </u-menu-item>
        </template>
      </u-menu>
    </nav>
    <!-- 移动端汉堡菜单按钮 -->
    <button class="head-nav__hamburger" :aria-label="t('headNav.ariaToggleMenu')" @click="mobileMenuOpen = !mobileMenuOpen">
      <span class="head-nav__hamburger-line" :class="{ 'is-open': mobileMenuOpen }" />
    </button>

    <!-- 移动端导航抽屉 -->
    <Transition name="mobile-nav-fade">
      <div v-show="mobileMenuOpen" class="head-nav__mobile-overlay" @click.self="mobileMenuOpen = false">
        <nav class="head-nav__mobile-drawer" :aria-label="t('headNav.ariaMainNav')">
          <router-link
            v-for="r in visibleRoutes"
            :key="r.path"
            :to="r.path"
            class="head-nav__mobile-link"
            :class="{ 'is-active': route.path === r.path }"
            @click="mobileMenuOpen = false"
          >
            {{ navTitle(r) }}
          </router-link>
          <!-- 查看后台入口（游客/普通用户可见） -->
          <button
            v-if="guestAdminVisible"
            class="head-nav__mobile-link head-nav__mobile-admin-btn"
            @click="handleMobileGuestAdmin"
          >
            <u-icon icon="fa-solid fa-eye" style="margin-right: 6px" />
            {{ t('guestAdmin.label') }}
          </button>
        </nav>
      </div>
    </Transition>

    <!-- 右：认证区 -->
    <div class="head-nav__actions">
      <!-- 已登录：头像 + 用户名 → 悬浮下拉菜单 -->
      <template v-if="isLoggedIn">
        <div
          ref="userMenuRef"
          class="head-nav__user-menu"
        >
          <!-- 触发区域：点击切换下拉 -->
          <div class="head-nav__trigger" @click="showDropdown = !showDropdown">
            <img
              v-if="userStore.user?.avatar"
              class="head-nav__avatar"
              :src="userStore.user.avatar"
              :alt="name"
            />
            <u-icon v-else class="head-nav__avatar-icon" icon="fa-solid fa-circle-user" />
            <u-text class="head-nav__user" :ellipsis="true" :title="name">{{ name }}</u-text>
            <u-icon
              class="head-nav__caret"
              :class="{ 'is-open': showDropdown }"
              icon="fa-solid fa-chevron-down"
            />
          </div>
          <!-- 下拉面板 -->
          <Transition name="dropdown-fade">
            <div v-show="showDropdown" class="head-nav__dropdown">
              <!-- 用户信息头部 -->
              <div class="head-nav__dropdown-header">
                <img
                  v-if="userStore.user?.avatar"
                  class="head-nav__dropdown-avatar"
                  :src="userStore.user.avatar"
                  :alt="name"
                />
                <u-icon v-else class="head-nav__dropdown-avatar-icon" icon="fa-solid fa-circle-user" />
                <div class="head-nav__dropdown-info">
                  <span class="head-nav__dropdown-name">{{ name }}</span>
                  <span class="head-nav__dropdown-email">{{ userStore.user?.email }}</span>
                </div>
              </div>
              <div class="head-nav__dropdown-divider" />
              <!-- 菜单项 -->
              <div class="head-nav__dropdown-item" @click="handleGoMyPage">
                <u-icon icon="fa-solid fa-house-user" />
                <span>{{ t('profile.myHomepage') }}</span>
              </div>
              <div class="head-nav__dropdown-item" @click="handleEditProfile">
                <u-icon icon="fa-solid fa-user-pen" />
                <span>{{ t('profile.editProfile') }}</span>
              </div>
              <!-- 分享我的博客 -->
              <div class="head-nav__dropdown-item" @click="handleCopyShareLink">
                <u-icon icon="fa-solid fa-share-nodes" />
                <span>{{ t('profile.shareBlog') }}</span>
              </div>
              <!-- 管理后台入口（仅 admin / super_admin 可见） -->
              <div v-if="isAdmin" class="head-nav__dropdown-item" @click="handleGoAdmin">
                <u-icon icon="fa-solid fa-gear" />
                <span>{{ t('profile.adminPanel') }}</span>
              </div>
              <div class="head-nav__dropdown-divider" />
              <div class="head-nav__dropdown-item head-nav__dropdown-item--danger" @click="handleLogout">
                <u-icon icon="fa-solid fa-right-from-bracket" />
                <span>{{ t('auth.logout') }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </template>
      <!-- 未登录：登录按钮 -->
      <template v-else>
        <u-button class="head-nav__login-btn" size="small" type="primary" @click="router.push('/login')">
          {{ t('auth.login') }}
        </u-button>
      </template>
    </div>

    <!-- 个人资料编辑弹窗 -->
    <ProfileEditModal v-model:visible="profileModalVisible" />
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { UMenu, UMenuItem, USubMenu } from '@/components/Menu'
import ProfileEditModal from '@/components/ProfileEditModal.vue'
import { useRouter, useRoute, type RouteRecordRaw } from 'vue-router'
import { useHeaderStore } from '@/stores/header'
import { HEADER_HEIGHT_PX } from '@/constants/layout'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { useBlogOwnerStore } from '@/stores/blogOwner'
import { pxToRem } from '@u-blog/utils'
import { useClickOutside } from '@u-blog/composables'
import { UMessageFn } from '@u-blog/ui'
import { useGuestAdmin } from '@/composables/useGuestAdmin'


defineOptions({
  name: 'HeadNav',
})

const { t } = useI18n({ useScope: 'global' })
const headerStore = useHeaderStore()
const appStore = useAppStore()
const userStore = useUserStore()
const blogOwnerStore = useBlogOwnerStore()
const router = useRouter()
const route = useRoute()

/* 游客查看后台 */
const { visible: guestAdminVisible, openAdmin: openGuestAdmin } = useGuestAdmin()

const isLoggedIn = computed(() => userStore.isLoggedIn)
/** 当前用户是否拥有管理后台权限（admin / super_admin） */
const isAdmin = computed(() => {
  const role = userStore.user?.role
  return role === 'admin' || role === 'super_admin'
})

const showDropdown = ref(false)
const profileModalVisible = ref(false)
const mobileMenuOpen = ref(false)

// 点击用户菜单外部时关闭下拉
const userMenuRef = ref<HTMLElement | null>(null)
useClickOutside(userMenuRef, () => {
  showDropdown.value = false
})

/**
 * 导航路由过滤：
 * - 需认证路由（write / chat）对未登录用户隐藏
 * - 例外：子域名「完整模式」允许游客看到 chat 导航
 * - write 始终需要登录（游客无法创作）
 */
const visibleRoutes = computed(() =>
  appStore.routes?.filter((v: RouteRecordRaw) => {
    if (!v.name || !v.meta?.isAffix) return false
    if (v.meta?.requiresAuth && !isLoggedIn.value) {
      // 子域名完整模式：允许游客看到 chat 入口
      const routeName = String(v.name)
      if (blogOwnerStore.isSubdomainMode && !blogOwnerStore.isReadOnly && routeName === 'chat') {
        return true
      }
      return false
    }
    return true
  })
)

function navTitle(route: { name?: string | symbol | null; meta?: { title?: string } }) {
  const name = route.name != null ? String(route.name) : ''
  const key = name && name !== 'NotFound' ? `nav.${name}` : ''
  return key && t(key) !== key ? t(key) : (route.meta?.title ?? '')
}



const logo = computed(() => headerStore.logo)
const siteName = computed(() => headerStore.siteName || t('common.blog'))
const name = computed(
  () => userStore.user?.namec || userStore.user?.username || t('common.guest')
)
const navHeight = computed(() => pxToRem(HEADER_HEIGHT_PX))

async function handleLogout() {
  showDropdown.value = false
  await userStore.logout()
  router.push('/home')
}

function handleEditProfile() {
  showDropdown.value = false
  profileModalVisible.value = true
}

/** 跳转到我的主页 */
function handleGoMyPage() {
  showDropdown.value = false
  const username = userStore.user?.username
  if (username) {
    router.push(`/@${username}`)
  }
}

/**
 * 将文本写入剪贴板（兼容非安全上下文）
 * 优先使用 Clipboard API，失败时回退到 execCommand
 */
async function copyToClipboard(text: string): Promise<boolean> {
  // 优先尝试 Clipboard API（需要 HTTPS 或 localhost）
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 降级到 execCommand
    }
  }
  // Fallback：创建临时 textarea 并执行 execCommand('copy')
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/** 复制分享链接到剪贴板（子域名格式） */
async function handleCopyShareLink() {
  showDropdown.value = false
  const username = userStore.user?.username
  if (!username) return
  const shareUrl = blogOwnerStore.buildShareUrl(username)
  const ok = await copyToClipboard(shareUrl)
  if (ok) {
    UMessageFn({ type: 'success', message: t('profile.shareLinkCopied') })
  } else {
    UMessageFn({ type: 'error', message: t('profile.shareLinkFailed') })
  }
}

/** 管理后台入口（prod: /admin/，dev: http://localhost:5174） */
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL
  || (import.meta.env.PROD ? '/admin/' : 'http://localhost:5174')

function handleGoAdmin() {
  showDropdown.value = false
  window.open(ADMIN_URL, '_blank')
}

/** 移动端汉堡菜单中的查看后台入口 */
function handleMobileGuestAdmin() {
  mobileMenuOpen.value = false
  openGuestAdmin()
}
</script>

<style lang="scss" scoped>
.head-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--u-shadow-2);
  background-color: var(--u-background-1);
  padding: 0 var(--app-shell-spacing-lg, 24px);
  box-sizing: border-box;

  /* 左：品牌区 */
  &__brand {
    display: flex;
    align-items: center;
    gap: var(--app-shell-spacing-sm, 12px);
    cursor: pointer;
    flex-shrink: 0;
  }

  &__logo {
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    object-fit: cover;
  }

  /* 无 logo 时的 SVG 图标兜底 */
  &__logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    background: var(--u-primary);
    color: #fff;
    flex-shrink: 0;
  }

  &__site-name {
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--u-text-1);
    max-width: 12rem;
  }

  /* 中：导航区 */
  &__nav {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    :deep(.u-menu) {
      display: flex;
      align-items: center;
      gap: var(--app-shell-spacing-xs, 8px);
    }
    :deep(.u-menu-item a) {
      font-size: 1.4rem;
    }
    :deep(.router-link-exact-active) {
      font-weight: 600;
      color: var(--u-primary-0);
    }
    /* 暗色主题下导航项悬浮用中性抬升背景，避免 primary-light-8 过暗 */
    :root.dark & :deep(.u-menu-item:hover:not(.is-disabled)) {
      background-color: var(--u-background-3);
      color: var(--u-text-1);
    }
    :root.dark & :deep(.u-sub-menu .u-sub-menu__title:hover:not(.is-disabled)) {
      background-color: var(--u-background-3);
    }
  }

  /* 右：用户/认证区 */
  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  /* 用户菜单包裹层 */
  &__user-menu {
    position: relative;
  }

  /* 触发区域 */
  &__trigger {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    border-radius: 0.8rem;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--u-background-2);
    }
  }

  &__avatar {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    object-fit: cover;
  }

  &__avatar-icon {
    font-size: 2.4rem;
    color: var(--u-text-3);
  }

  &__user {
    font-size: 1.4rem;
    color: var(--u-text-2);
    max-width: 8rem;
    display: block;
  }

  &__caret {
    font-size: 1rem;
    color: var(--u-text-3);
    transition: transform 0.25s ease;

    &.is-open {
      transform: rotate(180deg);
    }
  }

  /* 下拉面板 */
  &__dropdown {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    min-width: 22rem;
    background-color: var(--u-background-1);
    border: 1px solid var(--u-border-1);
    border-radius: 1.2rem;
    box-shadow: var(--u-shadow-3, 0 8px 24px rgba(0, 0, 0, 0.12));
    padding: 0.4rem 0;
    z-index: 100;
    box-sizing: border-box;
  }

  /* 下拉面板 - 用户信息头部 */
  &__dropdown-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem 1.6rem;
  }

  &__dropdown-avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__dropdown-avatar-icon {
    font-size: 3.6rem;
    color: var(--u-text-3);
    flex-shrink: 0;
  }

  &__dropdown-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  &__dropdown-name {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--u-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dropdown-email {
    font-size: 1.2rem;
    color: var(--u-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 分割线 */
  &__dropdown-divider {
    height: 1px;
    background-color: var(--u-border-1);
    margin: 0.4rem 0;
  }

  /* 菜单项 */
  &__dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.6rem;
    font-size: 1.4rem;
    color: var(--u-text-2);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: var(--u-background-2);
      color: var(--u-text-1);
    }

    /* 危险项（登出） */
    &--danger {
      color: var(--u-danger, #e74c3c);

      &:hover {
        background-color: rgba(231, 76, 60, 0.08);
        color: var(--u-danger, #e74c3c);
      }
    }
  }

  &__login-btn {
    font-size: 1.3rem;
  }

  /* 游客查看后台按钮 */


  /* 汉堡菜单按钮：仅移动端可见 */
  &__hamburger {
    display: none;
    flex-shrink: 0;
    width: 3.6rem;
    height: 3.6rem;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  &__hamburger-line {
    display: block;
    width: 2rem;
    height: 2px;
    background-color: var(--u-text-1);
    position: relative;
    transition: background-color 0.3s;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: var(--u-text-1);
      transition: transform 0.3s;
    }
    &::before { top: -6px; }
    &::after { top: 6px; }

    /* 展开态：X 号 */
    &.is-open {
      background-color: transparent;
      &::before { transform: translateY(6px) rotate(45deg); }
      &::after { transform: translateY(-6px) rotate(-45deg); }
    }
  }

  /* 移动端导航遮罩 */
  &__mobile-overlay {
    display: none;
  }
}

/* ---- 移动端响应式 ≤ 767px ---- */
@media (max-width: 767px) {
  .head-nav {
    padding: 0 12px;

    /* 桌面导航隐藏 */
    &__nav {
      display: none !important;
    }

    /* 汉堡按钮可见 */
    &__hamburger {
      display: flex;
      order: -1;
      margin-right: 8px;
    }

    /* 品牌区缩小 */
    &__logo {
      width: 2.4rem;
      height: 2.4rem;
    }
    &__site-name {
      font-size: 1.3rem;
      max-width: 8rem;
    }

    /* 用户名隐藏，仅保留头像 */
    &__user {
      display: none;
    }
    &__caret {
      display: none;
    }

    /* 移动端导航遮罩 */
    &__mobile-overlay {
      display: block;
      position: fixed;
      top: v-bind(navHeight);
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 99;
    }

    /* 移动端导航抽屉 */
    &__mobile-drawer {
      background: var(--u-background-1);
      border-bottom: 1px solid var(--u-border-1);
      box-shadow: var(--u-shadow-3, 0 8px 24px rgba(0, 0, 0, 0.12));
      padding: 8px 0;
      display: flex;
      flex-direction: column;
    }

    &__mobile-link {
      display: block;
      padding: 12px 24px;
      font-size: 1.5rem;
      color: var(--u-text-2);
      text-decoration: none;
      transition: background 0.15s, color 0.15s;

      &:hover,
      &.is-active {
        background: var(--u-background-2);
        color: var(--u-primary-0);
        font-weight: 600;
      }
    }

    /* 汉堡菜单中查看后台按钮：继承 mobile-link 样式，重置 button 默认 */
    &__mobile-admin-btn {
      width: 100%;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      border-top: 1px solid var(--u-border-1);
    }
  }
}

/* 移动端导航过渡动画 */
.mobile-nav-fade-enter-active,
.mobile-nav-fade-leave-active {
  transition: opacity 0.25s ease;
}
.mobile-nav-fade-enter-from,
.mobile-nav-fade-leave-to {
  opacity: 0;
}

/* 下拉面板过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.6rem);
}
</style>
