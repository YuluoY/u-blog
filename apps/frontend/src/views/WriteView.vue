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

      <!-- 右下角浮动发布按钮（可拖拽调整位置） -->
      <button
        ref="publishFabRef"
        class="write-view__publish-fab"
        :class="{ 'is-hidden': panelVisible, 'is-dragging': fabDragging }"
        :style="fabStyle"
        @click="onFabClick"
        :aria-label="isEditMode ? t('write.updateArticle') : t('write.publishArticle')"
      >
        <u-icon :icon="['fas', isEditMode ? 'pen-to-square' : 'paper-plane']" />
        <span class="write-view__publish-fab-text">{{ isEditMode ? t('write.updateArticle') : t('write.publish') }}</span>
      </button>
    </u-region>
  </u-layout>

  <!-- 发布抽屉（使用 UI 组件库 UDrawer） -->
  <u-drawer
    v-model="panelVisible"
    :title="isEditMode ? t('write.updateArticle') : t('write.publishArticle')"
    :width="400"
    placement="right"
  >
    <WriteSaveForm
      ref="saveFormRef"
      :content="draft"
      :user-id="unref(user)?.id ?? null"
      :edit-mode="isEditMode"
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
import { computed, ref, unref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { UNotificationFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useDraggablePosition } from '@/composables/useDraggablePosition'
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
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const editorTheme = computed(() => (appStore.theme === CTheme.DARK ? 'dark' : 'light'))

/** 编辑模式：URL 携带 ?edit=<articleId> 时进入 */
const editArticleId = computed(() => {
  const id = route.query.edit
  return id ? parseInt(id as string, 10) : null
})
const isEditMode = computed(() => !!editArticleId.value && !Number.isNaN(editArticleId.value))

const { draft, flushDraft } = useWriteDraft(250)

const writeEditorRef = ref<InstanceType<typeof WriteEditor> | null>(null)
const saveFormRef = ref<InstanceType<typeof WriteSaveForm> | null>(null)
const saveLoading = ref(false)
/** 发布面板是否展示 */
const panelVisible = ref(false)

/* ---------- 可拖拽发布按钮 ---------- */
const publishFabRef = ref<HTMLElement | null>(null)
const { position: fabPosition, isDragging: fabDragging } = useDraggablePosition(publishFabRef, {
  storageKey: 'u-blog:write-fab-position',
  defaultPosition: { right: 24, bottom: 24 },
})
/** 按钮定位样式 */
const fabStyle = computed(() => ({
  right: `${fabPosition.value.right}px`,
  bottom: `${fabPosition.value.bottom}px`,
}))
/** 拖拽中不触发点击 */
function onFabClick() {
  if (fabDragging.value) return
  panelVisible.value = true
}

function onEditorContent(v: string) {
  draft.value = v
}

/** 内置保存（Ctrl+S / 工具栏保存按钮）：同步草稿到 draft */
async function handleSave(value?: string) {
  const content = value ?? writeEditorRef.value?.getContent() ?? draft.value
  draft.value = content
  await flushDraft()
}

/**
 * 编辑模式：加载已有文章数据到编辑器和表单
 */
async function loadArticleForEdit(articleId: number) {
  try {
    const article = await api(CTable.ARTICLE).getArticleById(String(articleId))
    if (!article) {
      UNotificationFn({ message: t('write.saveFail'), type: 'error', deduplicate: true })
      return
    }
    // 验证是否是自己的文章
    if (article.userId !== user.value?.id) {
      UNotificationFn({ message: t('write.loginRequired'), type: 'error', deduplicate: true })
      router.replace('/')
      return
    }
    // 填充编辑器内容
    draft.value = article.content || ''
    await nextTick()
    writeEditorRef.value?.setContent?.(article.content || '')
    // 填充发布表单
    await nextTick()
    saveFormRef.value?.loadEditData({
      title: article.title,
      desc: article.desc,
      categoryId: (article as any).categoryId ?? article.category?.id ?? null,
      tags: article.tags,
      status: article.status,
      isPrivate: article.isPrivate,
      isTop: article.isTop,
      cover: article.cover,
      publishedAt: article.publishedAt,
    })
  } catch (e) {
    UNotificationFn({
      message: (e instanceof Error ? e.message : t('write.saveFail')),
      type: 'error',
      deduplicate: true,
    })
  }
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
  protect?: string | null
}) {
  const userId = userStore.user?.id
  if (userId == null) return
  const content = writeEditorRef.value?.getContent() ?? payload.content ?? draft.value
  saveLoading.value = true
  try {
    if (isEditMode.value && editArticleId.value) {
      // 编辑模式：更新文章
      await api(CTable.ARTICLE).updateArticle(editArticleId.value, {
        ...payload,
        content,
        userId,
      })
      panelVisible.value = false
      UNotificationFn({
        message: t('write.updateSuccess'),
        type: 'success',
        deduplicate: true,
      })
      // 跳转到文章阅读页
      router.push(`/read/${editArticleId.value}`)
    } else {
      // 新建模式：创建文章
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
    }
  } catch (e) {
    UNotificationFn({
      message: (e instanceof Error ? e.message : t('write.saveFail')),
      type: 'error',
      deduplicate: true,
    })
  } finally {
    saveLoading.value = false
  }
}

/* ---------- 编辑模式：监听路由参数变化加载文章 ---------- */
watch(editArticleId, (id) => {
  if (id && !Number.isNaN(id)) {
    loadArticleForEdit(id)
  }
}, { immediate: true })
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
  /* right / bottom 由 :style 动态设置 */
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
  cursor: grab;
  box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.25s;
  touch-action: none; /* 禁止浏览器默认触摸行为，确保 pointer 事件流畅 */
  user-select: none;

  &:hover:not(.is-dragging) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
  }

  &:active:not(.is-dragging) {
    transform: translateY(0);
  }

  &.is-dragging {
    cursor: grabbing;
    box-shadow: 0 8px 28px rgba(0, 123, 255, 0.45);
    transition: box-shadow 0.15s;
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