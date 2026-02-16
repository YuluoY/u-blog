<template>
  <div class="tags-panel">
    <u-text class="tags-panel__title">标签</u-text>
    <div v-if="tagList.length" class="tags-panel__cloud">
      <span
        v-for="tag in tagList"
        :key="tag.id"
        class="tags-panel__tag"
        :style="tagStyle(tag)"
        :title="`${tag.name}`"
      >
        {{ tag.name }}
      </span>
    </div>
    <u-text v-else class="tags-panel__empty">暂无标签</u-text>
  </div>
</template>

<script setup lang="ts">
import { useTagStore } from '@/stores/model/tag'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'TagsPanel' })

const { tagList } = storeToRefs(useTagStore())

/** 使用数据库中每个 tag 的真实 color 字段 */
function tagStyle(tag: { color?: string }) {
  const c = tag.color
  if (!c) return {}
  return {
    '--tag-bg': c.replace('rgb(', 'rgba(').replace(')', ', 0.1)'),
    '--tag-color': c,
    color: c,
    backgroundColor: c.replace('rgb(', 'rgba(').replace(')', ', 0.1)'),
    borderColor: c.replace('rgb(', 'rgba(').replace(')', ', 0.25)'),
  }
}
</script>

<style lang="scss" scoped>
.tags-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    &:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }
  }

  &__empty {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
  }
}
</style>
