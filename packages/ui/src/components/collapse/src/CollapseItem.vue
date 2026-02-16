<!--
  CollapseItem 折叠项：单个可展开/收起的区块，依赖父级 Collapse 的 provide 上下文。
-->
<template>
  <div
    class="u-collapse-item"
    :class="{ 'is-active': isActive, 'is-disabled': disabled }"
  >
    <div
      class="u-collapse-item__header"
      role="button"
      :aria-expanded="isActive"
      :aria-disabled="disabled"
      :aria-controls="contentId"
      :id="headerId"
      tabindex="0"
      @click="onClick"
      @keydown.enter.prevent="onClick"
      @keydown.space.prevent="onClick"
    >
      <div class="u-collapse-item__title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div class="u-collapse-item__arrow">
        <slot name="icon">
          <u-icon
            icon="angle-right"
            v-bind="iconProps ?? void 0"
          />
        </slot>
      </div>
    </div>
    <UCollapseTransition>
      <div
        v-show="isActive"
        class="u-collapse-item__wrap"
        :id="contentId"
        role="region"
        :aria-labelledby="headerId"
      >
        <div
          v-if="$slots.default"
          class="u-collapse-item__content"
          :aria-hidden="!isActive"
        >
          <slot />
        </div>
      </div>
    </UCollapseTransition>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import type { UCollapseContext, UCollapseItemProps } from '../types'
import { COLLAPSE_CTX_KEY } from '../consts'
import UCollapseTransition from '../components/CollapseTransition.vue'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UCollapseItem'
})
const props = withDefaults(defineProps<UCollapseItemProps>(), {})
const ctx = inject(COLLAPSE_CTX_KEY) as UCollapseContext
const id = useId()
const headerId = `u-collapse-header-${id}`
const contentId = `u-collapse-content-${id}`

// 当前项是否处于展开状态
const isActive = computed(() => ctx.activeNames.value.includes(props.name))

const onClick = () =>
{
  if (props.disabled)
    return
  ctx.handleItemClick(props.name)
}

</script>
<style>

</style>