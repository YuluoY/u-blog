<template>
  <u-layout class="layout-base">
    <u-region
      class="layout-base__top"
      region="top"
      :style="{
        height: route.meta.isHero ? '100vh' : 'auto',
      }"
    >
      <HeadNav class="layout-base__nav" ref="headNavRef"></HeadNav>
      <HomeHero
        v-show="route.meta?.isHero"
        class="layout-base__hero"
        :title="heroStore.title"
        :desc="heroStore.desc"
        :img="heroStore.img"
        :gap="heroContentGap"
        :title-style="titleStyle"
        :desc-style="descStyle"
      />
    </u-region>
    <u-region
      region="center"
      class="layout-base__center"
      :style="{ marginTop: route.meta?.isHero ? '0' : topNavHeight }"
    >
      <u-layout>
        <u-region region="left" id="layout-center__left">
          <SideLeft v-show="route.meta?.isLeftSide"></SideLeft>
        </u-region>
        <u-region region="center" id="layout-center__center">
          <Suspense>
            <slot></slot>
          </Suspense>
        </u-region>
        <u-region region="right" id="layout-center__right">
          <SideRight v-show="route.meta?.isRightSide"></SideRight>
        </u-region>
      </u-layout>
    </u-region>
    <u-region region="bottom" class="layout-base__bottom">
      <BottomInfo></BottomInfo>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { pxToRem } from '@u-blog/utils'
import HeadNav from '@/components/HeadNav.vue'
import BottomInfo from '@/components/BottomInfo.vue'
import HomeHero from '@/components/HomeHero.vue'
import SideLeft from '@/components/SideLeft/index.vue'
import SideRight from '@/components/SideRight/index.vue'
import { useHeaderStore } from '@/stores/header'
import { useFooterStore } from '@/stores/footer'
import { useHeroStore } from '@/stores/hero'
import { useTransStyle } from '@/composables/useTransStyle'

defineOptions({
  name: 'LayoutBase',
})

const route = useRoute()
const headerStore = useHeaderStore()
const footerStore = useFooterStore()
const heroStore = useHeroStore()

const headNavRef = ref<InstanceType<typeof HeadNav>>()

const topNavHeight = computed<string>(() => headerStore.height ? pxToRem(headerStore.height) : 'auto')
const bottomInfoHeight = computed<string>(() => pxToRem(footerStore.height))

const heroContentGap = computed(() => pxToRem(heroStore.gap))

const titleStyle = computed(() => useTransStyle(heroStore.titleStyles))
const descStyle = computed(() => useTransStyle(heroStore.descStyles))

onMounted(() =>
{
  if (headNavRef.value?.headNavElement?.$el)
    headerStore.setHeight(headNavRef.value.headNavElement.$el.clientHeight)
})
</script>

<style lang="scss" scoped>
.layout-base {
  min-height: inherit;
  .layout-base__top {
    height: 100vh;
    max-height: 100vh;
    position: relative;
    flex-direction: column;
    .layout-base__nav {
      height: v-bind(topNavHeight);
      // height: fit-content;
    }
    .layout-base__hero {
      flex: 1;
      position: absolute;
      top: 0;
      height: calc(100vh - v-bind(topNavHeight));
      margin-top: v-bind(topNavHeight);
    }
  }
  .layout-base__center {
    padding: 1.6rem;
    // min-height: v-bind(centerHeight);
    #layout-center__left {
      padding-right: 1.6rem;
    }
    #layout-center__right {
      padding-left: 1.6rem;
    }
    #layout-center__left,
    #layout-center__right {
      width: 20%;
      position: relative;
    }
    #layout-center__center {
      width: calc(60% - 1.6rem * 2);
    }
  }
  .layout-base__bottom {
    height: v-bind(bottomInfoHeight);
    margin-top: 1.6rem;
  }
}
</style>
