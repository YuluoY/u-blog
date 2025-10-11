
<template>
  <div class="u-button-group">
    <slot />
  </div>
</template>

<script setup lang="ts">
  
defineOptions({
  name: 'UButtonGroup'
})
</script>

<style lang="scss">
  .u-button-group {
    display: inline-flex;
    vertical-align: middle;
  
    .u-button {
      margin: 0;
      border-radius: 0;
    }

    .u-button:first-child {
      border-top-left-radius: var(--uc-border-radius-4);
      border-bottom-left-radius: var(--uc-border-radius-4);
    }
    .u-button:last-child {
      border-top-right-radius: var(--uc-border-radius-4);
      border-bottom-right-radius: var(--uc-border-radius-4);
    }
  }
</style>