<template>
  <header class="head-nav" :style="{ height: navHeight }">
    <!-- 左：Logo + 站点名 -->
    <div class="head-nav__brand" @click="router.push('/')">
      <img class="head-nav__logo" :src="logo" alt="" />
      <u-text class="head-nav__site-name" :ellipsis="true">{{ siteName }}</u-text>
    </div>
    <!-- 中：路由导航 -->
    <nav class="head-nav__nav" aria-label="主导航">
      <u-menu>
        <template v-for="r in routes" :key="r.path">
          <u-sub-menu v-if="r.children?.length">
            <template #title>
              <u-text>{{ r.meta?.title }}</u-text>
            </template>
            <u-menu-item v-for="c in r.children" :key="c.path" :route="c.path">
              <u-text>{{ c.meta?.title }}</u-text>
            </u-menu-item>
          </u-sub-menu>
          <u-menu-item v-else :route="r.path">
            <u-text>{{ r.meta?.title }}</u-text>
          </u-menu-item>
        </template>
      </u-menu>
    </nav>
    <!-- 右：用户信息 -->
    <div class="head-nav__actions">
      <u-text class="head-nav__user" :ellipsis="true" :title="name">{{ name }}</u-text>
    </div>
  </header>
</template>

<script setup lang="ts">
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

const headerStore = useHeaderStore()
const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const routes = computed(() =>
  appStore.routes?.filter((v: RouteRecordRaw) => v.name && v.meta?.isAffix)
)

const logo = computed(() => headerStore.logo)
const siteName = computed(() => headerStore.siteName || '博客')
const name = computed(
  () => userStore.user?.username ?? (headerStore.name || '游客')
)
const navHeight = computed(() => pxToRem(HEADER_HEIGHT_PX))
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
  }

  /* 右：用户区 */
  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  &__user {
    font-size: 1.4rem;
    color: var(--u-text-2);
    max-width: 8rem;
    display: block;
  }
}
</style>
