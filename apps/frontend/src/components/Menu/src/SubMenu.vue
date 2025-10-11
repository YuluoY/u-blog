<template>
  <div class="u-sub-menu">
    <div class="u-sub-menu-title">
      <slot name="title"></slot>
    </div>
    <div class="u-sub-menu-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'USubMenu'
})
</script>
