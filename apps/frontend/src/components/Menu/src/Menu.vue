<template>
  <div class="u-menu">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import type { UMenuProps } from '../types'
import { CMenuContextKey, CMenuType, type UMenuType } from '../types/const'
defineOptions({
  name: 'UMenu'
})
const props = withDefaults(defineProps<UMenuProps>(), {
  type: CMenuType.HORIZONTAL
})

const type = defineModel<UMenuType>('type')
const defaultActive = defineModel<string>('defaultActive')

provide(
  CMenuContextKey,
  reactive({
    type,
    defaultActive
  })
)
</script>

<style lang="scss">
@use '../styles/index.scss';
</style>
