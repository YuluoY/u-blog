<template>
  <div class="toc-panel">
    <u-text class="toc-panel__title">{{ t('toc.title') }}</u-text>
    <u-text v-if="!isArticlePage" class="toc-panel__hint">{{ t('toc.hint') }}</u-text>
    <slot v-else>
      <u-text class="toc-panel__empty">{{ t('toc.empty') }}</u-text>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'TocPanel' })

const { t } = useI18n()
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
