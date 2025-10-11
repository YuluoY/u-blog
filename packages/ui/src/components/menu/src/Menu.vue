<template>
  <div class="u-menu">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UMenu',
})

</script>

<style lang="scss">
@forward "../styles/index.scss";
</style>
