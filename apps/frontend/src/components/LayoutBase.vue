<template>
  <u-layout class="layout-base" mode="column">
    <!-- 顶部：Header 固定吸顶 -->
    <u-region region="top" class="layout-base__top">
      <HeadNav class="layout-base__header" />
    </u-region>

    <!-- 中间：Body = IconBar + SidePanel + Main -->
    <u-region region="center" class="layout-base__body" :style="bodyOffsetStyle">
      <!--
        三列容器用原生 flex 而非 u-layout mode="row"，
        因为 u-layout 的 span 网格会覆盖固定宽+自适应的 flex 规则。
      -->
      <div class="layout-base__body-inner">
        <aside class="layout-base__icon-bar-wrap" :style="iconBarWrapStyle">
          <IconBar />
        </aside>
        <aside class="layout-base__side-panel-wrap" :style="sidePanelWrapStyle">
          <SidePanel />
        </aside>
        <main
          :class="[
            'layout-base__main',
            {
              'layout-base__main--chat': isChatRoute,
              'layout-base__main--about': isAboutRoute,
              'layout-base__main--sidebar-collapsed':
              sidebarStore.collapsed && !isWriteRoute && !isChatRoute,
            },
          ]"
        >
          <Suspense>
            <slot />
          </Suspense>
        </main>
      </div>
    </u-region>

    <!-- 折叠态：Popover 展示面板内容 -->
    <PopoverPanel />

    <!-- 设置抽屉（从右侧滑出） -->
    <SettingsDrawer
      :model-value="appStore.settingsDrawerVisible"
      @update:model-value="appStore.setSettingsDrawerVisible"
    />

    <!-- 底部：Footer -->
    <u-region region="bottom" class="layout-base__bottom">
      <BottomInfo />
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { pxToRem } from '@u-blog/utils'
import HeadNav from '@/components/HeadNav.vue'
import BottomInfo from '@/components/BottomInfo.vue'
import IconBar from '@/components/AppShell/IconBar.vue'
import SidePanel from '@/components/AppShell/SidePanel.vue'
import PopoverPanel from '@/components/AppShell/PopoverPanel.vue'
import SettingsDrawer from '@/components/AppShell/SettingsDrawer.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { useAppStore } from '@/stores/app'
import { HEADER_HEIGHT_PX, FOOTER_HEIGHT_PX, ICON_BAR_WIDTH_PX, SIDE_PANEL_WIDTH_PX } from '@/constants/layout'
import { useRoute } from 'vue-router'

defineOptions({
  name: 'LayoutBase',
})

const route = useRoute()
const sidebarStore = useSidebarStore()
const appStore = useAppStore()

const isChatRoute = computed(() => route.name === 'chat')
const isAboutRoute = computed(() => route.name === 'about')
const isWriteRoute = computed(() => route.name === 'write')

/** Icon Bar 固定宽度 */
const iconBarWrapStyle = computed(() => ({
  width: pxToRem(ICON_BAR_WIDTH_PX),
  minWidth: pxToRem(ICON_BAR_WIDTH_PX),
}))

/** Side Panel：展开时固定宽度，折叠/无面板时宽度为 0 */
const sidePanelWrapStyle = computed(() => {
  const visible = !sidebarStore.collapsed && sidebarStore.activePanel != null
  return {
    width: visible ? pxToRem(SIDE_PANEL_WIDTH_PX) : '0',
    minWidth: visible ? pxToRem(SIDE_PANEL_WIDTH_PX) : '0',
  }
})

const headerHeightRem = computed(() => pxToRem(HEADER_HEIGHT_PX))
const footerHeightRem = computed(() => pxToRem(FOOTER_HEIGHT_PX))

/** Body 需要向下偏移 Header 高度 */
const bodyOffsetStyle = computed(() => ({
  marginTop: headerHeightRem.value,
}))
</script>

<style lang="scss" scoped>
.layout-base {
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 覆盖 u-layout 的 overflow:hidden，否则 fixed header 和内容会被裁剪 */
  overflow: visible;

  /* 顶部 */
  &__top {
    flex-shrink: 0;
    .layout-base__header {
      height: v-bind(headerHeightRem);
    }
  }

  /* Body：填满 Header 与 Footer 之间，高度受限以便 main 内部可滚动 */
  &__body {
    flex: 1 1 0%;
    height: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* 三列容器：原生 flex，icon-bar 和 side-panel 固定宽，main 填满剩余 */
  &__body-inner {
    display: flex;
    flex: 1;
    min-height: 0;
    align-items: stretch;
  }

  /* Icon Bar：固定宽，不缩不长 */
  &__icon-bar-wrap {
    flex: 0 0 auto;
    overflow: hidden;
  }

  /* Side Panel：固定宽或 0，填满 body 高度，带过渡动画 */
  &__side-panel-wrap {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    transition: width 0.2s ease, min-width 0.2s ease;
  }

  /* Main：根据侧边栏折叠状态切换宽度策略 */
  &__main {
    min-width: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    transition: flex 0.2s ease, width 0.2s ease, max-width 0.2s ease;

    /* 侧边栏展开：占满剩余宽度 */
    &:not(.layout-base__main--sidebar-collapsed) {
      flex: 1 1 0%;
      > * {
        margin-left: auto;
        margin-right: auto;
      }
    }

    /* 侧边栏折叠：60% 宽度居中 */
    &--sidebar-collapsed {
      flex: 0 1 60%;
      width: 60%;
      max-width: 60%;
      margin-left: auto;
      margin-right: auto;
      > * {
        margin-left: auto;
        margin-right: auto;
      }
    }

    /* Chat 模式：去除 padding，让 ChatView 自行控制布局 */
    &--chat {
      padding: 0;
      overflow: hidden;
      
      > * {
        margin: 0;
        width: 100%;
      }
    }

    /* 关于页：占满主内容区宽度，不居中收窄 */
    &--about {
      > * {
        margin-left: 0 !important;
        margin-right: 0 !important;
        width: 100% !important;
        max-width: none !important;
      }
    }
  }

  /* Footer */
  &__bottom {
    flex-shrink: 0;
    min-height: v-bind(footerHeightRem);
  }
}

/* 响应式：小屏隐藏 Side Panel，主区始终占满，缩小 padding */
@media (max-width: 767px) {
  .layout-base__side-panel-wrap {
    display: none;
  }
  .layout-base__main {
    padding: 12px;
    flex: 1 1 0% !important;
    width: 100% !important;
    max-width: none !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
</style>
