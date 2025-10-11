<template>
  <table>
    <thead>
      <tr>
        <th>序号</th>
        <th>姓名</th>
        <th>年龄</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>张三</td>
        <td>20</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { UTableProps } from '../types'

defineOptions({
  name: 'UTable'
})

withDefaults(defineProps<UTableProps>(), {
})

</script>

<style lang="scss"> 
@forward '../styles/index.scss';
</style>
