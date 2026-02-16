<!--
  MenuItem 菜单项：单条可选中项，依赖父级 Menu 的 activeIndex，支持 disabled 与键盘/无障碍。
-->
<template>
  <li
    class="u-menu-item"
    :class="{ 'is-active': isActive, 'is-disabled': disabled }"
    role="menuitem"
    :aria-disabled="disabled"
    :aria-current="isActive ? 'true' : undefined"
    :tabindex="disabled ? -1 : 0"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    @keydown.space.prevent="onClick"
  >
    <slot />
  </li>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { CMenuCtx } from '../consts'
import type { UMenuItemProps } from '../types'

defineOptions({
  name: 'UMenuItem'
})

const props = withDefaults(defineProps<UMenuItemProps>(), {
  disabled: false
})

const ctx = inject(CMenuCtx)!
const isActive = computed(() => ctx.activeIndex.value === props.index)

function onClick() {
  if (props.disabled) return
  ctx.setActiveIndex(props.index)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
