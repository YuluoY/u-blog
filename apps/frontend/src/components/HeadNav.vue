<template>
  <u-layout class="head-nav" mode="row" :style="{ height: navHeight }">
    <u-region class="head-nav-left" :span="navLeftWidth" align="center" justify="space-around" :title="name">
      <div class="head-nav-left__image" @click="router.push('/')">
        <img :src="logo" alt="随机图片" />
      </div>
      <div class="head-nav-left__name">
        <span>{{ name }}</span>
      </div>
    </u-region>
    <u-region class="head-nav-menu" justify="flex-end">
      <u-menu>
        <template v-for="r in routes" :key="r.path">
          <u-sub-menu v-if="r.children?.length">
            <template #title>
              <span>{{ r.meta?.title }}</span>
            </template>
            <u-menu-item v-for="c in r.children" :key="c.path">
              <span>{{ c.meta?.title }}</span>
            </u-menu-item>
          </u-sub-menu>
          <u-menu-item v-else :route="r.path">
            <span>{{ r.meta?.title }}</span>
          </u-menu-item>
        </template>
      </u-menu>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { UMenu, UMenuItem, USubMenu } from '@/components/Menu'
import { useRouter, type RouteRecordRaw } from 'vue-router'
import { useHeaderStore, TOP_NAV_HEIGHT_PX } from '@/stores/header'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { pxToRem } from '@u-blog/utils'
defineOptions({
  name: 'HeadNav'
})

const headerStore = useHeaderStore()
const appStore = useAppStore()
const userStore = useUserStore()

const router = useRouter()
const routes = computed(() => appStore.routes?.filter((v: RouteRecordRaw) => v.name && v.meta?.isAffix))

const logo = computed(() => headerStore.logo)
const name = computed(() => userStore.user?.username ?? (headerStore.name || '游客'))
const navLeftWidth = computed(() => headerStore.leftWidth)
const navHeight = computed(() => pxToRem(TOP_NAV_HEIGHT_PX))
</script>

<style lang="scss" scoped>
.head-nav {
  position: fixed;
  top: 0;
  z-index: 10000;
  box-shadow: var(--uc-shadow-2);
  background-color: var(--uc-background-1);
  box-sizing: border-box;
  padding: 0 1rem;
  align-items: center;
  .head-nav-left {
    overflow: hidden;
    .head-nav-left__image {
      width: 3rem;
      height: 3rem;
      overflow: hidden;
      border-radius: 50%;
      cursor: pointer;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    .head-nav-left__name {
      flex: 1;
      margin-left: 0.8rem;
      line-height: 1.5;
      display: inline-block;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      font-size: 1.4rem;
    }
  }
  .head-nav-menu {
    :deep(a) {
      font-size: 1.4rem;
    }
  }
}
</style>
