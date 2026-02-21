<template>
  <u-layout class="write-view-layout">
    <u-region region="center" class="write-view__center">
      <!-- 编辑器区域（全宽） -->
      <div class="write-view__editor-wrap">
        <WriteEditor
          ref="writeEditorRef"
          :initial-content="draft"
          :theme="editorTheme"
          @update:content="onEditorContent"
          @save="handleSave"
        />
      </div>

      <!-- 右下角浮动发布按钮 -->
      <button
        class="write-view__publish-fab"
        :class="{ 'is-hidden': panelVisible }"
        @click="panelVisible = true"
        :aria-label="t('write.publishArticle')"
      >
        <u-icon :icon="['fas', 'paper-plane']" />
        <span class="write-view__publish-fab-text">{{ t('write.publish') }}</span>
      </button>
    </u-region>
  </u-layout>

  <!-- 发布抽屉（使用 UI 组件库 UDrawer） -->
  <u-drawer
    v-model="panelVisible"
    :title="t('write.publishArticle')"
    :width="400"
    placement="right"
  >
    <WriteSaveForm
      ref="saveFormRef"
      :content="draft"
      :user-id="unref(user)?.id ?? null"
      @submit="onSaveSubmit"
    />
    <template #footer>
      <u-button plain @click="panelVisible = false">{{ t('common.cancel') }}</u-button>
      <u-button
        type="primary"
        :loading="saveLoading"
        :disabled="!saveFormRef?.canSubmit"
        @click="saveFormRef?.submit()"
      >
        {{ saveFormRef?.submitLabel || t('write.publish') }}
      </u-button>
    </template>
  </u-drawer>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { UNotificationFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { CTheme, CTable } from '@u-blog/model'
import { useWriteDraft } from '@/composables/useWriteDraft'
import WriteEditor from '@/components/WriteEditor.vue'
import WriteSaveForm from '@/components/WriteSaveForm.vue'
import { storeToRefs } from 'pinia'
import api from '@/api'
import { putDraft } from '@/utils/writeDraftDb'

defineOptions({
  name: 'WriteView'
})

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const editorTheme = computed(() => (appStore.theme === CTheme.DARK ? 'dark' : 'light'))

const { draft, flushDraft } = useWriteDraft(250)

const writeEditorRef = ref<InstanceType<typeof WriteEditor> | null>(null)
const saveFormRef = ref<InstanceType<typeof WriteSaveForm> | null>(null)
const saveLoading = ref(false)
/** 发布面板是否展示 */
const panelVisible = ref(false)

function onEditorContent(v: string) {
  draft.value = v
}

/** 内置保存（Ctrl+S / 工具栏保存按钮）：同步草稿到 draft */
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
    const article = await api(CTable.ARTICLE).createArticle({
      ...payload,
      content,
      userId
    })
    panelVisible.value = false

    // 清理编辑器草稿 + 发布配置缓存
    draft.value = ''
    await putDraft('')
    saveFormRef.value?.clearCache()

    // 跳转到发布成功页
    router.push({
      name: 'writeSuccess',
      query: {
        id: String(article.id),
        title: encodeURIComponent(payload.title)
      }
    })
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
    overflow: hidden;
    position: relative;
  }
}

/* ---------- 编辑器区域 ---------- */
.write-view__editor-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--u-background-1, #fff);
}

/* ---------- 浮动发布按钮 ---------- */
.write-view__publish-fab {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 2rem;
  background: var(--u-primary, #007bff);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.25s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(8px);
  }
}

.write-view__publish-fab-text {
  white-space: nowrap;
}
</style>