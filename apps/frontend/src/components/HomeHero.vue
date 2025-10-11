<template>
  <div class="home-hero">
    <div class="home-hero__image">
      <img :src="img" alt="hero" />
    </div>
    <div class="home-hero__content" :style="{ gap }">
      <span class="home-hero__title" :style="titleStyle">{{ title }}</span>
      <span class="home-hero__desc" :style="descStyle">{{ desc }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pxToRem } from '@u-blog/utils'
import { isString } from 'lodash-es'
import type { CSSProperties } from 'vue'

defineOptions({
  name: 'HomeHero'
})

const props = withDefaults(
  defineProps<{
    title?: string
    desc?: string
    img?: string
    gap?: string | number
    titleStyle?: CSSProperties
    descStyle?: CSSProperties
  }>(),
  {
    title: '欢迎来到我的博客',
    desc: '这是一个分享技术和生活的地方',
    img: new URL('/src/assets/images/8.jpg', import.meta.url).href
  }
)

const gap = computed(() => isString(props.gap) ? props.gap : pxToRem(props.gap as number))

</script>

<style scoped lang="scss">
.home-hero {
  width: 100%;
  height: 100%;
  position: relative;
  .home-hero__image {
    position: relative;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .home-hero__content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    color: var(--uc-text-9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    word-break: break-word;
  }
}
</style>
