
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

const activeNames = ref(props.modelValue || [])

const updateActiveNames = (names: string[]): void =>
{
  activeNames.value = names
  emit('update:modelValue', names)
  emit('change', names)
}
const modelValueWatcher = watch(() => props.modelValue, newVal => updateActiveNames(newVal as string[]))

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