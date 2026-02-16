<!--
  SubMenu 子菜单：可展开/收起的子菜单块，挂载时向 Menu 增加层级，支持 title 插槽与键盘/无障碍。
-->
<template>
  <li
    class="u-sub-menu"
    :class="{ 'is-opened': isOpened, 'is-disabled': disabled }"
    role="none"
  >
    <div
      class="u-sub-menu__title"
      role="button"
      :aria-expanded="isOpened"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <slot name="title">{{ title }}</slot>
      <span class="u-sub-menu__arrow" :class="{ 'is-opened': isOpened }">▼</span>
    </div>
    <ul v-show="isOpened" class="u-sub-menu__list" role="menu">
      <slot />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import { CMenuCtx } from '../consts'
import type { USubMenuProps } from '../types'

defineOptions({
  name: 'USubMenu'
})

const props = withDefaults(defineProps<USubMenuProps>(), {
  title: '',
  disabled: false
})

const ctx = inject(CMenuCtx)!
const isOpened = ref(false)

onMounted(() => { ctx.addSubMenuLevel(1) })
onBeforeUnmount(() => { ctx.addSubMenuLevel(-1) })

function toggle() {
  if (props.disabled) return
  isOpened.value = !isOpened.value
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
