<!--
  Tabs 标签页：顶部等宽 tab 条，内容区与当前 tab 对应。
-->
<template>
  <div class="u-tabs">
    <div class="u-tabs__header" role="tablist">
      <template v-if="tabList.length">
        <button
          v-for="tab in tabList"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeKey === tab.key"
          :disabled="tab.disabled"
          class="u-tabs__tab"
          :class="{ 'is-active': activeKey === tab.key }"
          @click="select(tab.key)"
        >
          <u-icon v-if="tab.icon" :icon="tab.icon" class="u-tabs__tab-icon" />
          <span class="u-tabs__tab-label">{{ tab.label }}</span>
        </button>
      </template>
      <slot v-else name="tabs" :active-key="activeKey" :select="select">
        <!-- 由 TabPane 或默认 slot 提供 -->
      </slot>
    </div>
    <div class="u-tabs__content">
      <slot :active-key="activeKey" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, provide } from 'vue'
import { UIcon } from '@/components/icon'
import type { TabOption, UTabsEmits, UTabsProps } from '../types'

defineOptions({ name: 'UTabs', inheritAttrs: false })

const props = withDefaults(defineProps<UTabsProps>(), {
  tabs: () => []
})

const emits = defineEmits<UTabsEmits>()

const innerKey = ref(props.modelValue ?? props.activeKey ?? '')

const activeKey = computed(() => {
  const v = props.modelValue ?? props.activeKey
  if (v !== undefined && v !== '') return v
  return innerKey.value || (props.tabs?.length ? props.tabs[0]?.key : '')
})

provide('u-tabs-active-key', () => activeKey.value)

const tabList = computed(() => props.tabs ?? [])

watch(
  () => props.modelValue ?? props.activeKey,
  (val) => {
    if (val !== undefined) innerKey.value = val
  }
)

function select(key: string) {
  const tab = tabList.value.find((t) => t.key === key)
  if (tab?.disabled) return
  innerKey.value = key
  emits('update:modelValue', key)
  emits('tab-change', key)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
