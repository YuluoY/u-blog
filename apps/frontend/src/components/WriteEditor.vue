<template>
  <MdEditor
    v-model="content"
    :theme="theme"
    class="write-view__editor"
    :toolbars="toolbars"
    :def-toolbars="defToolbars"
    @on-save="onSave"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MdEditor, allToolbar } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

/** 有自定义工具栏时，在「保存」右侧插入索引 0，使 defToolbars 第一个按钮显示 */
const toolbars = computed(() => {
  if (!props.defToolbars) return undefined
  const eqIdx = (allToolbar as string[]).indexOf('=')
  const left = (allToolbar as string[]).slice(0, eqIdx >= 0 ? eqIdx : undefined)
  const right = eqIdx >= 0 ? (allToolbar as string[]).slice(eqIdx) : []
  return [...left, 0, ...right]
})

defineOptions({
  name: 'WriteEditor'
})

const props = withDefaults(
  defineProps<{
    /** 初始内容（如从 IndexedDB 加载的草稿），仅当 content 仍为空时同步一次 */
    initialContent: string
    theme?: 'light' | 'dark'
    defToolbars?: unknown
  }>(),
  {
    theme: 'light',
    defToolbars: undefined
  }
)

const emit = defineEmits<{
  (e: 'update:content', value: string): void
  (e: 'save'): void
}>()

/** 内部内容，仅在此组件内与 MdEditor 双向绑定，避免父级 draft 每次变化触发 setValue 导致光标丢失 */
const content = ref(props.initialContent || '')
let syncFromInitialDone = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 250

// 仅当 initialContent 首次有值且 content 仍为空时同步（IndexedDB 异步加载完成后）
watch(
  () => props.initialContent,
  (val) => {
    if (syncFromInitialDone) return
    if (content.value === '' && val !== '') {
      content.value = val
      syncFromInitialDone = true
    }
  },
  { immediate: true }
)

watch(
  content,
  (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      emit('update:content', val)
      debounceTimer = null
    }, DEBOUNCE_MS)
  },
  { deep: false }
)

function onSave() {
  emit('update:content', content.value)
  emit('save')
}

/** 供父组件获取当前全文（如打开保存弹窗、快捷键保存前同步） */
function getContent(): string {
  return content.value
}

/** 立即将当前内容同步到父级（先 emit 再让父级 flush） */
function flushSync(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  emit('update:content', content.value)
}

defineExpose({
  getContent,
  flushSync
})
</script>

<style scoped>
.write-view__editor {
  flex: 1;
  min-height: 320px;
}
</style>
