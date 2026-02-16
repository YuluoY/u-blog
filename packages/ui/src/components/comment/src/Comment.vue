<!--
  Comment 评论区容器：可选标题/副标题，默认插槽放置输入区与列表（由使用方组合 UCommentInput + UCommentList）。
-->
<template>
  <div class="u-comment">
    <header v-if="showTitle && (title || $slots.title)" class="u-comment__header">
      <slot name="title">
        <div class="u-comment__title">{{ title }}</div>
        <div v-if="subtitle" class="u-comment__subtitle">{{ subtitle }}</div>
      </slot>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { UCommentProps } from '../types'

defineOptions({
  name: 'UComment'
})

withDefaults(defineProps<UCommentProps>(), {
  showTitle: true,
  title: '',
  subtitle: ''
})
</script>

<style lang="scss">
@use '../styles/index.scss';
</style>
