<template>
  <u-layout class="write-view-layout">
    <u-region region="center" class="write-view__center">
      <div class="write-view__editor-wrap">
        <WriteEditor
          ref="writeEditorRef"
          :initial-content="draft"
          :theme="editorTheme"
          :def-toolbars="saveArticleToolbarVNode"
          @update:content="onEditorContent"
          @save="handleSave"
        />
      </div>
    </u-region>
    <WriteSaveModal
      v-model="saveModalVisible"
      :content="saveModalContent"
      :user-id="user?.id"
      :loading="saveLoading"
      @submit="onSaveSubmit"
    />
  </u-layout>
</template>

<script setup lang="ts">
import { h, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { UNotificationFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { CTheme, CTable } from '@u-blog/model'
import { useWriteDraft } from '@/composables/useWriteDraft'
import WriteEditor from '@/components/WriteEditor.vue'
import WriteSaveModal from '@/components/WriteSaveModal.vue'
import { storeToRefs } from 'pinia'
import api from '@/api'

defineOptions({
  name: 'WriteView'
})

const { t } = useI18n()
const appStore = useAppStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const editorTheme = computed(() => (appStore.theme === CTheme.DARK ? 'dark' : 'light'))

const { draft, flushDraft } = useWriteDraft(250)

const writeEditorRef = ref<InstanceType<typeof WriteEditor> | null>(null)
const saveModalVisible = ref(false)
const saveLoading = ref(false)
/** 打开保存弹窗时写入当前编辑器内容，供弹窗提交用 */
const saveModalContent = ref('')

watch(saveModalVisible, (visible) => {
  if (visible) {
    saveModalContent.value = writeEditorRef.value?.getContent() ?? draft.value
  }
})

/** 工具栏「保存文章」按钮：先同步内容，再弹出保存/发布表单（与快捷键「仅存本地」区分） */
const saveArticleToolbarVNode = ref(
  h(
    'button',
    {
      type: 'button',
      class: 'md-editor-toolbar-item write-view__toolbar-save-article',
      title: t('write.saveArticle'),
      onClick: () => {
        writeEditorRef.value?.flushSync()
        flushDraft().then(() => { saveModalVisible.value = true })
      }
    },
    t('write.saveArticle')
  )
)

function onEditorContent(v: string) {
  draft.value = v
}

/** 快捷键 Ctrl+S：仅同步并存入本地草稿，不弹表单 */
async function handleSave() {
  writeEditorRef.value?.flushSync()
  await flushDraft()
  UNotificationFn({ message: t('write.savedToLocal'), type: 'success' })
}

async function onSaveSubmit(payload: {
  title: string
  content: string
  desc?: string
  status: string
  publishedAt: string
  categoryId?: number | null
  isPrivate: boolean
  isTop: boolean
}) {
  const userId = userStore.user?.id
  if (userId == null) return
  saveLoading.value = true
  try {
    await api(CTable.ARTICLE).createArticle({
      ...payload,
      userId
    })
    UNotificationFn({ message: t('write.saveSuccess'), type: 'success' })
    saveModalVisible.value = false
  } catch (e) {
    UNotificationFn({
      message: (e instanceof Error ? e.message : t('write.saveFail')),
      type: 'error'
    })
  } finally {
    saveLoading.value = false
  }
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

:deep(.write-view__toolbar-save-article) {
  margin-left: 4px;
  padding: 2px 8px;
  font-size: 12px;
}

.write-view__editor {
  flex: 1;
  min-height: 320px;
}
</style>