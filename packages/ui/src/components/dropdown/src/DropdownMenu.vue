
<!--
  DropdownMenu 下拉菜单容器：包裹下拉项列表，提供 role="menu" 以符合无障碍。
-->
<template>
  <ul class="u-dropdown-menu" role="menu">
    <slot />
  </ul>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UDropdownMenu'
})
</script>