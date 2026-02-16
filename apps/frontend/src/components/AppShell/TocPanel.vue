<template>
  <div class="toc-panel">
    <u-text class="toc-panel__title">目录</u-text>
    <u-text v-if="!isArticlePage" class="toc-panel__hint">仅在文章详情页显示目录</u-text>
    <slot v-else>
      <u-text class="toc-panel__empty">暂无目录</u-text>
    </slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TocPanel' })

const route = useRoute()
const isArticlePage = computed(() => route.name === 'read')
</script>

<style lang="scss" scoped>
.toc-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }
  &__hint, &__empty {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
  }
}
</style>
