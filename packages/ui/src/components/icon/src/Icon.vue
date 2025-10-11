
<template>
  <i
    class="u-icon"
    :class="{
      [`u-icon--${type}`]: type
    }"
    :style="iconStyles"
    v-bind="$attrs"
  >
    <font-awesome-icon v-bind="filterProps" />
  </i>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { UIconProps } from '../types'
import { omit } from 'lodash-es'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineOptions({
  name: 'UIcon',
  inheritAttrs: false
})

const props = defineProps<UIconProps>()
const filterProps = computed<any>(() => omit(props, ['type', 'color']))
const iconStyles = computed<CSSProperties>(() => ({ color: props.color ?? void 0 }))

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>