<template>
  <div class="u-image">

  </div>
</template>

<script lang="ts" setup>
import type { UImageProps } from '../types'

defineOptions({
  name: 'UImage'
})

const props = withDefaults(defineProps<UImageProps>(), {
  src: '',
  alt: '',
  width: '',
  height: '',
  fit: 'cover',
})

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>