<template>
  <u-layout class="write-view-layout">
    <u-region region="center" class="write-view__center">
      <!-- 可折叠表单区：折叠时仅占一行，不压缩编辑器高度 -->
      <div class="write-view__form" :class="[`write-view__form--${formLayout}`, { 'write-view__form--collapsed': !formExpanded }]">
        <div class="write-view__form-header" @click="formExpanded = !formExpanded">
          <span class="write-view__form-title">{{ t('write.formPanel') }}</span>
          <div v-if="formExpanded && showLayoutSwitch" class="write-view__form-layout-wrap" @click.stop>
            <label for="write-view-form-layout-select" class="write-view__form-layout-label">
              {{ t('write.formLayout') }}
            </label>
            <u-select
              id="write-view-form-layout-select"
              v-model="formLayout"
              :options="formLayoutOptions"
              class="write-view__form-layout-select"
            />
          </div>
          <u-button plain size="small" class="write-view__form-toggle" :aria-label="formExpanded ? t('write.collapseForm') : t('write.expandForm')">
            <u-icon :icon="formExpanded ? ['fas', 'chevron-up'] : ['fas', 'chevron-down']" />
          </u-button>
        </div>
        <div v-show="formExpanded" class="write-view__form-body">
          <WriteSaveForm
            :content="draft"
            :user-id="unref(user)?.id ?? null"
            :loading="saveLoading"
            :layout="formLayout"
            inline
            @submit="onSaveSubmit"
          />
        </div>
      </div>
      <div class="write-view__editor-wrap">
        <WriteEditor
          ref="writeEditorRef"
          :initial-content="draft"
          :theme="editorTheme"
          @update:content="onEditorContent"
          @save="handleSave"
        />
      </div>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { UNotificationFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { CTheme, CTable } from '@u-blog/model'
import { useWriteDraft } from '@/composables/useWriteDraft'
import WriteEditor from '@/components/WriteEditor.vue'
import WriteSaveForm from '@/components/WriteSaveForm.vue'
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
const saveLoading = ref(false)
/** 表单折叠状态：默认折叠，避免占用编辑器高度 */
const formExpanded = ref(false)
/** 表单布局：card | compact | grid | minimal，见 WriteViewFormLayouts.md */
const formLayout = ref<'card' | 'compact' | 'grid' | 'minimal'>('card')
const showLayoutSwitch = true
const formLayoutOptions = computed(() => [
  { value: 'card', label: t('write.layoutCard') },
  { value: 'compact', label: t('write.layoutCompact') },
  { value: 'grid', label: t('write.layoutGrid') },
  { value: 'minimal', label: t('write.layoutMinimal') }
])

function onEditorContent(v: string) {
  draft.value = v
}

/** 内置保存（Ctrl+S / 工具栏保存按钮）：同步草稿到 draft，表单已在上方内嵌 */
async function handleSave(value?: string) {
  const content = value ?? writeEditorRef.value?.getContent() ?? draft.value
  draft.value = content
  await flushDraft()
}

async function onSaveSubmit(payload: {
  title: string
  content: string
  desc?: string
  status: string
  publishedAt: string
  categoryId?: number | null
  tags?: number[]
  isPrivate: boolean
  isTop: boolean
  cover?: string | null
}) {
  const userId = userStore.user?.id
  if (userId == null) return
  const content = writeEditorRef.value?.getContent() ?? payload.content ?? draft.value
  saveLoading.value = true
  try {
    await api(CTable.ARTICLE).createArticle({
      ...payload,
      content,
      userId
    })
    UNotificationFn({ message: t('write.saveSuccess'), type: 'success' })
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
/* 与 LayoutBase、ReadView、SidePanel 等一致：u-layout/u-region 需 min-height:0 + 滚动区 overflow-y:auto 才有滚动条 */
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
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.write-view__form {
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid var(--u-border-1, #dcdfe6);
  background: var(--u-background-1, #fff);
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.write-view__form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  user-select: none;
  min-height: 2.5rem;
  box-sizing: border-box;
}

.write-view__form--collapsed .write-view__form-header {
  margin-bottom: 0;
}

.write-view__form-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--u-text-2, #606266);
}

.write-view__form-toggle {
  margin-left: auto;
}

.write-view__form-body {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--u-border-1, #ebeef5);
}

.write-view__form-layout-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.write-view__form-layout-label {
  font-size: 0.875rem;
  color: var(--u-text-3, #666);
}

.write-view__form-layout-select {
  width: 140px;
}

.write-view__form--card .write-view__form-body {
  display: block;
}

.write-view__editor-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--u-border-1, #dcdfe6);
  overflow: hidden;
  background: var(--u-background-1, #fff);
}

.write-view__editor {
  flex: 1;
  min-height: 320px;
}
</style>