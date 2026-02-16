<template>
  <u-layout class="write-view-layout">
    <u-region region="center" class="write-view__center">
      <div class="write-view__editor-wrap">
        <MdEditor
          v-model="text"
          :theme="editorTheme"
          class="write-view__editor"
          @on-save="handleSave"
        />
      </div>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { UDialogFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { CTheme } from '@u-blog/model'

defineOptions({
  name: 'WriteView'
})

const appStore = useAppStore()
const editorTheme = computed(() => (appStore.theme === CTheme.DARK ? 'dark' : 'light'))

const text = ref<string>('')

const handleSave = (_content: string) => {
  console.log(_content)
  UDialogFn({
    title: '保存',
    content: '确定保存吗？'
  })
}
</script>

<style lang="scss" scoped>
.write-view-layout {
  min-height: 100%;
  :deep(.u-layout__body) {
    min-height: 0;
  }
  :deep(.u-region__center) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.write-view__editor-wrap {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--u-border-1);
  overflow: hidden;
  background: var(--u-background-1);
}

.write-view__editor {
  flex: 1;
  min-height: 320px;
}
</style>