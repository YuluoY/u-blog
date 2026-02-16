<!--
  ButtonGroup 按钮组：将多个按钮横向排列，首尾圆角、中间无间隙。
-->
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
      border-top-left-radius: var(--u-border-radius-4);
      border-bottom-left-radius: var(--u-border-radius-4);
    }
    .u-button:last-child {
      border-top-right-radius: var(--u-border-radius-4);
      border-bottom-right-radius: var(--u-border-radius-4);
    }
  }
</style>