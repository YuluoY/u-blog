<template>
  <u-layout ref="sideLeftRef" class="side-left" :gutter="16" mode="column">
    <u-region class="side-left-item">
      <u-card body-class="side-left-item-card" shadow="always" header="个人信息" collapse>
        <BaseInfoCard></BaseInfoCard>
      </u-card>
    </u-region>
    <u-region class="side-left-item">
      <u-card body-class="side-left-item-card" shadow="always" header="最新文章" collapse>
        <LatestArticleCard></LatestArticleCard>
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import type { ULayout } from '@u-blog/ui'
import { useFixed } from '@u-blog/composables'
import BaseInfoCard from './BaseInfoCard.vue'
import LatestArticleCard from './LatestArticleCard.vue'
import { useHeaderStore } from '@/stores/header'
defineOptions({
  name: 'SideLeft'
})
const headerStore = useHeaderStore()

const sideLeftRef = ref<InstanceType<typeof ULayout>>()
const sideLeftEl = computed(() => sideLeftRef.value?.$el)

onMounted(() =>
{
  useFixed({
    target: sideLeftEl.value as HTMLElement,
    top: 20,
    zIndex: 6,
    offsetTop: headerStore.height
  })
})
</script>

<style scoped lang="scss">
.side-left {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 6;
  width: 100%;
  height: fit-content;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;

  .side-left-item {
    width: 100%;
    height: fit-content;
    flex: unset;
    :deep(.side-left-item-card) {
      width: 100%;
      height: fit-content;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      gap: 0.4rem;
    }
  }
}
</style>
