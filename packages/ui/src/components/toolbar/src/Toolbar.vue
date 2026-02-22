<template>
  <!-- 基础工具条：纯布局 + 操作项渲染，不含任何定位逻辑 -->
  <div
    class="u-toolbar"
    :class="rootClasses"
    v-bind="$attrs"
  >
    <!-- 前置插槽 -->
    <slot name="prepend" />

    <!-- 加载态 -->
    <div v-if="props.loading" class="u-toolbar__loading">
      <u-icon icon="fa-solid fa-spinner" />
      <span>{{ props.loadingText || '处理中...' }}</span>
    </div>

    <!-- 操作项 -->
    <div v-else class="u-toolbar__actions">
      <slot>
        <button
          v-for="item in visibleActions"
          :key="item.key"
          class="u-toolbar__btn"
          :title="item.label"
          :disabled="item.disabled"
          @click="handleClick(item)"
        >
          <u-icon v-if="item.icon" :icon="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </slot>
    </div>

    <!-- 后置插槽 -->
    <slot name="append" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UToolbarProps, UToolbarEmits, UToolbarAction } from '../types'
import { CToolbarDefaultSize, CToolbarDefaultDirection } from '../consts'

defineOptions({ name: 'UToolbar', inheritAttrs: false })

const props = withDefaults(defineProps<UToolbarProps>(), {
  actions: () => [],
  loading: false,
  loadingText: '',
  size: CToolbarDefaultSize,
  direction: CToolbarDefaultDirection,
})

const emit = defineEmits<UToolbarEmits>()

/** 过滤掉 hidden 的操作项 */
const visibleActions = computed(() =>
  props.actions.filter((a) => !a.hidden)
)

/** 根节点 class 组合 */
const rootClasses = computed(() => ({
  [`u-toolbar--${props.size}`]: props.size !== 'default',
  'u-toolbar--vertical': props.direction === 'vertical',
}))

function handleClick(item: UToolbarAction) {
  if (item.disabled) return
  emit('action', item.key)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
