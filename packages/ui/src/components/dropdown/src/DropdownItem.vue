<template>
  <li
    v-if="divided"
    role="separator"
    class="u-dropdown-item__divider"
  />
  <li
    :class="{
      'u-dropdown-item': true,
      ['u-dropdown-item--' + size]: size,
      'is-disabled': disabled,
      'is-divided': divided
    }"
    @click="handleClick"
  >
    <slot name="icon">
      <u-icon
        v-if="icon"
        :icon="icon"
        v-bind="iconProps ?? void 0"
      />
    </slot>
    <span class="u-dropdown-item__label">
      <slot name="label">{{ label }}</slot>
    </span>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import type { UDropdownItemProps } from '../types'
import { CDropdownCtx } from '../consts'
import { UIcon } from '@/components'

defineOptions({
  name: 'UDropdownItem'
})
const props = withDefaults(defineProps<UDropdownItemProps>(), {
  disabled: false,
  divided: false,
  command: ''
})

// 生成唯一的 command ID
const commandId = `dropdown-item-${useId()}`
const finalCommand = computed(() => props.command || commandId)

const ctx = inject(CDropdownCtx)
const size = computed(() => ctx?.size.value)

function handleClick()
{
  if (props.disabled) return
  ctx?.handleItemClick({
    ...props,
    command: finalCommand.value
  })
}
</script>