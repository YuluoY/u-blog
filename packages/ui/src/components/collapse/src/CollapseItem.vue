
<template>
  <div
    class="u-collapse-item"
    :class="{
      'is-active': isActive,
      'is-disabled': disabled
    }"
  >
    <div
      class="u-collapse-item__header"
      @click="onClick"
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
import { computed, inject } from 'vue'
import type { UCollapseContext, UCollapseItemProps } from '../types'
import { COLLAPSE_CTX_KEY } from '../consts' 
import UCollapseTransition from '../components/CollapseTransition.vue'
import { UIcon } from '@/components'

defineOptions({
  name: 'UCollapseItem'
})
const props = withDefaults(defineProps<UCollapseItemProps>(), {})
const ctx = inject(COLLAPSE_CTX_KEY) as UCollapseContext

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