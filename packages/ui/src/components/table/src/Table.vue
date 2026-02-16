<!--
  Table 表格：根据 columns 与 data 渲染表头与单元格，支持列宽、对齐、formatter、斑马纹与边框。
-->
<template>
  <div class="u-table" :class="{ 'u-table--stripe': stripe, 'u-table--border': border }">
    <table>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.prop"
            :style="getColumnStyle(col)"
            :class="`is-${col.align || 'left'}`"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in data" :key="rowIndex">
          <td
            v-for="col in columns"
            :key="col.prop"
            :style="getColumnStyle(col)"
            :class="`is-${col.align || 'left'}`"
          >
            {{ getCellValue(row, col) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { UTableColumn, UTableProps } from '../types'

defineOptions({
  name: 'UTable'
})

const props = withDefaults(defineProps<UTableProps>(), {
  data: () => [],
  columns: () => [],
  stripe: false,
  border: false
})

/** 列样式：有 width 时转为 px 或原样使用 */
function getColumnStyle(col: UTableColumn): CSSProperties {
  if (col.width) {
    return {
      width: typeof col.width === 'number' ? `${col.width}px` : col.width
    }
  }
  return {}
}

/** 单元格显示值：优先 formatter，否则 row[prop]，空为 — */
function getCellValue(row: any, col: UTableColumn): any {
  const value = row[col.prop]
  if (col.formatter) {
    return col.formatter(row, col, value)
  }
  return value ?? '—'
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
