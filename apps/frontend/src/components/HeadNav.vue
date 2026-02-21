<template>
  <header class="head-nav" :style="{ height: navHeight }">
    <!-- 左：Logo + 站点名 -->
    <div class="head-nav__brand" @click="router.push('/')">
      <img class="head-nav__logo" :src="logo" alt="" />
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
    <!-- 右：认证区 -->
    <div class="head-nav__actions">
      <!-- 已登录：头像 + 用户名 + 登出 -->
      <template v-if="isLoggedIn">
        <img
          v-if="userStore.user?.avatar"
          class="head-nav__avatar"
          :src="userStore.user.avatar"
          :alt="name"
        />
        <u-icon v-else class="head-nav__avatar-icon" icon="fa-solid fa-circle-user" />
        <u-text class="head-nav__user" :ellipsis="true" :title="name">{{ name }}</u-text>
        <u-button class="head-nav__logout" size="small" @click="handleLogout">
          {{ t('auth.logout') }}
        </u-button>
      </template>
      <!-- 未登录：登录/注册按钮 -->
      <template v-else>
        <u-button class="head-nav__login-btn" size="small" type="primary" @click="router.push('/login')">
          {{ t('auth.login') }}
        </u-button>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { UMenu, UMenuItem, USubMenu } from '@/components/Menu'
import { useRouter, type RouteRecordRaw } from 'vue-router'
import { useHeaderStore } from '@/stores/header'
import { HEADER_HEIGHT_PX } from '@/constants/layout'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { pxToRem } from '@u-blog/utils'

defineOptions({
  name: 'HeadNav',
})

const { t } = useI18n({ useScope: 'global' })
const headerStore = useHeaderStore()
const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const isLoggedIn = computed(() => userStore.isLoggedIn)

/** 已登录时显示全部导航；未登录时隐藏需要认证的路由（如撰写） */
const visibleRoutes = computed(() =>
  appStore.routes?.filter((v: RouteRecordRaw) => {
    if (!v.name || !v.meta?.isAffix) return false
    if (v.meta?.requiresAuth && !isLoggedIn.value) return false
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
  await userStore.logout()
  router.push('/home')
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

  &__logout {
    font-size: 1.2rem;
  }

  &__login-btn {
    font-size: 1.3rem;
  }
}
</style>
