<!--
  Menu 菜单：管理当前激活项 index、垂直/水平模式与折叠，通过 provide 向 MenuItem/SubMenu 提供上下文。
-->
<template>
  <ul
    class="u-menu"
    :class="[`u-menu--${mode}`]"
    role="menu"
    :aria-orientation="mode === 'vertical' ? 'vertical' : 'horizontal'"
  >
    <slot />
  </ul>
</template>

<script setup lang="ts">
import { provide, ref, watch } from 'vue'
import { CMenuCtx } from '../consts'
import type { UMenuCtx as CtxType, UMenuProps } from '../types'

defineOptions({
  name: 'UMenu'
})

const props = withDefaults(defineProps<UMenuProps>(), {
  defaultActive: '',
  mode: 'vertical',
  collapse: false
})

const activeIndex = ref(props.defaultActive)
const level = ref(0)

watch(() => props.defaultActive, (v) => { activeIndex.value = v })

function setActiveIndex(index: string) {
  if (activeIndex.value === index) return
  activeIndex.value = index
}

function getLevel() {
  return level.value
}

// 子 SubMenu 挂载/卸载时增减层级，用于缩进等
function addSubMenuLevel(val: number) {
  level.value += val
}

const ctx: CtxType = {
  activeIndex,
  mode: props.mode,
  level,
  setActiveIndex,
  getLevel,
  addSubMenuLevel
}

provide(CMenuCtx, ctx)
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
