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
        <main :class="['layout-base__main', { 'layout-base__main--chat': isChatRoute }]">
          <Suspense>
            <slot />
          </Suspense>
        </main>
      </div>
    </u-region>

    <!-- 折叠态：Popover 展示面板内容 -->
    <PopoverPanel />

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
import { useSidebarStore } from '@/stores/sidebar'
import { HEADER_HEIGHT_PX, FOOTER_HEIGHT_PX, ICON_BAR_WIDTH_PX, SIDE_PANEL_WIDTH_PX } from '@/constants/layout'
import { useRoute } from 'vue-router'

defineOptions({
  name: 'LayoutBase',
})

const route = useRoute()
const sidebarStore = useSidebarStore()

const isChatRoute = computed(() => route.name === 'chat')

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

  /* Body：填满 Header 与 Footer 之间 */
  &__body {
    flex: 1;
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

  /* Main：自适应填满剩余宽度，内容区居中并约束可读宽度 */
  &__main {
    flex: 1 1 0%;
    min-width: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    /* 内容宽度约束：正文行长 45-85 字符 ≈ 720-880px */
    > * {
      margin-left: auto;
      margin-right: auto;
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
  }

  /* Footer */
  &__bottom {
    flex-shrink: 0;
    min-height: v-bind(footerHeightRem);
  }
}

/* 响应式：小屏隐藏 Side Panel，缩小 Main padding */
@media (max-width: 767px) {
  .layout-base__side-panel-wrap {
    display: none;
  }
  .layout-base__main {
    padding: 12px;
  }
}
</style>
