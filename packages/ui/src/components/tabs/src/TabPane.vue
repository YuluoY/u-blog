<!--
  TabPane 单个标签页：用于配合 UTabs 默认 slot，仅渲染内容；若用 tabs prop 则不需要。
-->
<template>
  <div v-show="active" class="u-tab-pane" role="tabpanel">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { UTabPaneProps } from '../types'

defineOptions({ name: 'UTabPane' })

const props = defineProps<UTabPaneProps>()

const activeKey = inject<() => string>('u-tabs-active-key', () => '')
const active = computed(() => activeKey() === props.key)
</script>

<style lang="scss" scoped>
.u-tab-pane {
  outline: none;
}
</style>
