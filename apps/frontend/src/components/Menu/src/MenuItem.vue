<template>
  <div class="u-menu-item">
    <router-link v-if="props.route" :to="props.route">
      <slot></slot>
    </router-link>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import type { UMenuItemProps } from '../types'

defineOptions({
  name: 'UMenuItem'
})

const props = withDefaults(defineProps<UMenuItemProps>(), {})
</script>
