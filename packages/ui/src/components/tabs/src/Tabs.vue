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

<style lang="scss" scoped>
.u-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.u-tabs__header {
  display: flex;
  flex: 0 0 auto;
  border-bottom: 1px solid var(--u-border-1);
  background: var(--u-background-2);
  gap: 0;

  &[role='tablist'] {
    /* 等宽分布 */
    & .u-tabs__tab {
      flex: 1;
      min-width: 0;
      text-align: center;
    }
  }
}

.u-tabs__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1rem 1.2rem;
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--u-text-2);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;

  .u-tabs__tab-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
  }

  .u-tabs__tab-label {
    min-width: 0;
  }

  &:hover:not(.is-active):not(:disabled) {
    color: var(--u-text-1);
    background: var(--u-background-3);
  }

  &.is-active {
    color: var(--u-primary-0);
    border-bottom-color: var(--u-primary-0);
  }

  &:disabled {
    color: var(--u-text-4);
    cursor: not-allowed;
  }
}

.u-tabs__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.2rem 0;
}
</style>
