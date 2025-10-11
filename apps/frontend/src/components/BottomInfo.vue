<template>
  <u-layout class="bottom-info" mode="row">
    <u-region align="flex-start" :style="{ flexDirection: 'column', gap: '0.5rem' }">
      
    </u-region>
    <u-region align="flex-start" :style="{ flexDirection: 'column', gap: '0.5rem' }">
      <span class="bottom-info__copyright">Copyright &copy; {{ footerStore.siteYear }} {{ footerStore.author }}</span>
      <a href="https://icp.gov.moe/?keyword=20251077" target="_blank">萌ICP备20251077号</a>
      <a href="https://beian.miit.gov.cn/" target="_blank">{{ footerStore.icp }}</a>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useFooterStore } from '@/stores/footer'
defineOptions({
  name: 'BottomInfo'
})

const footerStore = useFooterStore()
</script>

<style lang="scss" scoped>
.bottom-info {
  width: 100%;
  height: 100%;
  padding: 0.5rem 1rem;
  box-shadow: var(--uc-shadow-2);
  background-color: var(--uc-background-1);
  .bottom-info__copyright {
    font-size: 1.4rem;
    color: var(--uc-text-2);
  }
}
</style>
