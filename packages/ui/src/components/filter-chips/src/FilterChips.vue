<!--
  FilterChips 筛选芯片区：左侧 label、可关闭的 tag 列表、可选清空按钮。
-->
<template>
  <div class="u-filter-chips">
    <u-text v-if="label" class="u-filter-chips__label">{{ label }}</u-text>
    <div class="u-filter-chips__list">
      <u-tag
        v-for="item in chips"
        :key="item.key"
        closable
        size="small"
        effect="plain"
        :type="item.tagType"
        :color="item.color"
        @close="onClose(item)"
      >
        {{ item.label }}
      </u-tag>
    </div>
    <u-button
      v-if="clearText"
      class="u-filter-chips__clear"
      size="small"
      text
      @click="emits('clear')"
    >
      {{ clearText }}
    </u-button>
  </div>
</template>

<script setup lang="ts">
import { UText } from '@/components/text'
import { UTag } from '@/components/tag'
import { UButton } from '@/components/button'
import type { UFilterChipsEmits, UFilterChipsProps, UFilterChipItem } from '../types'

defineOptions({
  name: 'UFilterChips'
})

const props = withDefaults(defineProps<UFilterChipsProps>(), {
  label: '',
  chips: () => [],
  clearText: ''
})

const emits = defineEmits<UFilterChipsEmits>()

function onClose(chip: UFilterChipItem) {
  emits('close', chip)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
