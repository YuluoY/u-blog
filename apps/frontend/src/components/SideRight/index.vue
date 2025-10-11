<template>
  <u-layout ref="sideRightRef" class="side-right" :gutter="16" mode="column">
    <u-region class="side-right-item">
      <u-card body-class="side-right-item-card" shadow="always" header="最新文章" collapse>
        asd
      </u-card>
    </u-region>
    <u-region class="side-right-item">
      <u-card body-class="side-right-item-card" shadow="always" header="最新文章" collapse>
        asd
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import type { ULayout } from '@u-blog/ui'
import { useFixed } from '@u-blog/composables'
import { useHeaderStore } from '@/stores/header'

defineOptions({
  name: 'SideRight'
})

const headerStore = useHeaderStore()

const sideRightRef = ref<InstanceType<typeof ULayout>>()
const sideRightEl = computed(() => sideRightRef.value?.$el)

onMounted(() =>
{
  useFixed({
    target: sideRightEl.value as HTMLElement,
    top: 20,
    zIndex: 6,
    offsetTop: headerStore.height
  })
})
</script>

<style scoped lang="scss">
.side-right {
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

  .side-right-item {
    width: 100%;
    height: fit-content;
    flex: unset;
    :deep(.side-right-item-card) {
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
