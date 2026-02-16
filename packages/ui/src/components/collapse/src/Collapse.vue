<!--
  Collapse 折叠面板：管理多个 CollapseItem 的展开/收起，支持手风琴模式与 v-model。
-->
<template>
  <div
    class="u-collapse"
    :class="{
      'is-accordion': accordion
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, provide, ref, watch } from 'vue'
import type { UCollapseEmits, UCollapseProps } from '../types'
import { COLLAPSE_CTX_KEY } from '../consts'

defineOptions({
  name: 'UCollapse'
})

const props = withDefaults(defineProps<UCollapseProps>(), {
  accordion: false
})
const emit = defineEmits<UCollapseEmits>()

// 当前展开的面板 name 列表
const activeNames = ref(props.modelValue || [])

/**
 * 更新展开项并同步 v-model 与 change 事件
 */
const updateActiveNames = (names: string[]): void =>
{
  activeNames.value = names
  emit('update:modelValue', names)
  emit('change', names)
}
// 外部 modelValue 变化时同步到内部
const modelValueWatcher = watch(() => props.modelValue, newVal => updateActiveNames(newVal as string[]))

/**
 * 点击某一项：手风琴模式下只保留一个；否则切换该项的展开/收起
 */
const handleItemClick = (name: string): void =>
{
  if (props.accordion)
  {
    updateActiveNames(activeNames.value.includes(name) ? [] : [name])
    return
  }
  if (activeNames.value.includes(name))
    updateActiveNames(activeNames.value.filter(item => item !== name))
  else
    updateActiveNames([...activeNames.value, name])
}

provide(COLLAPSE_CTX_KEY, {
  activeNames,
  handleItemClick
})

onBeforeUnmount(() =>
{
  modelValueWatcher()
})

defineExpose({
  activeNames,
  updateActiveNames
})
  
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>