<template>
  <u-form class="write-save-form" @submit.prevent="handleSubmit">
    <!-- 基本信息区 -->
    <section class="write-save-form__section">
      <h4 class="write-save-form__section-title">
        <u-icon :icon="['fas', 'pen-nib']" class="write-save-form__section-icon" />
        {{ t('write.sectionBasic') }}
      </h4>
      <div class="write-save-form__field-group">
        <u-form-item :label="t('write.titlePlaceholder')" required>
          <u-input
            v-model="form.title"
            :placeholder="t('write.titlePlaceholder')"
            :max-length="100"
            show-word-limit
          />
        </u-form-item>
        <u-form-item :label="t('write.descPlaceholder')">
          <u-input
            v-model="form.desc"
            type="textarea"
            :placeholder="t('write.descPlaceholder')"
            :rows="3"
            :max-length="255"
            show-word-limit
          />
        </u-form-item>
      </div>
    </section>

    <!-- 封面图区（使用 UUpload 组件） -->
    <section class="write-save-form__section">
      <h4 class="write-save-form__section-title">
        <u-icon :icon="['fas', 'image']" class="write-save-form__section-icon" />
        {{ t('write.sectionCover') }}
      </h4>
      <div class="write-save-form__cover-area">
        <u-upload
          :model-value="form.cover"
          accept="image/jpeg,image/png,image/webp,image/gif"
          :max-size="5"
          :placeholder="t('write.coverUpload')"
          aspect-ratio="16/9"
          :disabled="coverUploading"
          @change="onCoverFileChange"
          @remove="onCoverRemove"
          @exceed="onCoverExceed"
        >
          <template #tip>
            {{ coverUploading ? t('write.coverUploading') : t('write.coverUploadHint') }}
          </template>
        </u-upload>
        <!-- URL 输入模式切换 -->
        <div class="write-save-form__cover-toggle">
          <button
            type="button"
            class="write-save-form__cover-toggle-btn"
            @click="coverUrlMode = !coverUrlMode"
          >
            <u-icon :icon="coverUrlMode ? ['fas', 'upload'] : ['fas', 'link']" />
            {{ coverUrlMode ? t('write.coverFileMode') : t('write.coverUrlMode') }}
          </button>
        </div>
        <u-input
          v-if="coverUrlMode"
          v-model="form.cover"
          :placeholder="t('write.coverPlaceholder')"
        />
      </div>
    </section>

    <!-- 分类与标签区 -->
    <section class="write-save-form__section">
      <h4 class="write-save-form__section-title">
        <u-icon :icon="['fas', 'tags']" class="write-save-form__section-icon" />
        {{ t('write.sectionMeta') }}
      </h4>
      <div class="write-save-form__field-group">
        <u-form-item :label="t('write.categoryPlaceholder')" required>
          <u-select
            v-model="form.categoryId"
            :options="categoryOptions"
            :placeholder="t('write.categoryPlaceholder')"
          />
        </u-form-item>
        <u-form-item :label="t('write.tagsPlaceholder')">
          <u-select
            v-model="form.tags"
            :options="allTagOptions"
            :placeholder="t('write.tagsPlaceholder')"
            multiple
            :max-tag-count="3"
          />
        </u-form-item>
      </div>
    </section>

    <!-- 发布设置区 -->
    <section class="write-save-form__section">
      <h4 class="write-save-form__section-title">
        <u-icon :icon="['fas', 'sliders']" class="write-save-form__section-icon" />
        {{ t('write.sectionPublish') }}
      </h4>
      <div class="write-save-form__field-group">
        <u-form-item :label="t('write.statusLabel')" required>
          <u-select
            v-model="form.status"
            :options="statusOptions"
            :placeholder="t('write.statusDraft')"
          />
        </u-form-item>
        <u-form-item :label="t('write.publishTimeLabel')">
          <div class="write-save-form__publish-time">
            <u-checkbox v-model="publishNow">
              {{ t('write.publishNow') }}
            </u-checkbox>
            <u-date-time-picker
              v-if="!publishNow"
              v-model="form.publishedAt"
              type="datetime"
              class="write-save-form__datetime-input"
            />
          </div>
        </u-form-item>
        <div class="write-save-form__switches">
          <u-checkbox v-model="form.isPrivate">{{ t('write.isPrivate') }}</u-checkbox>
          <u-checkbox v-model="form.isTop">{{ t('write.isTop') }}</u-checkbox>
        </div>
      </div>
    </section>

    <!-- 登录提示 -->
    <p v-if="!userId" class="write-save-form__hint">
      <u-icon :icon="['fas', 'circle-info']" />
      {{ t('write.loginRequired') }}
    </p>
  </u-form>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { UNotificationFn } from '@u-blog/ui'
import { CArticleStatus, type ArticleStatus } from '@u-blog/model'
import api from '@/api'
import { CTable } from '@u-blog/model'
import type { ICategory, ITag } from '@u-blog/model'
import type { UploadFile } from '@u-blog/ui'
import { uploadFile, deleteMedia } from '@/api/request'
import { getPublishSettings, putPublishSettings, clearPublishSettings, type PublishSettingsRecord } from '@/utils/publishSettingsDb'

export interface WriteSaveFormPayload {
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
}

/** 日期格式化为 datetime-local 输入值 */
function toDatetimeLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

defineOptions({
  name: 'WriteSaveForm'
})

const props = withDefaults(
  defineProps<{
    content: string
    userId?: number | null
  }>(),
  {
    userId: null
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: WriteSaveFormPayload): void
}>()

const { t } = useI18n()

/* ---------- 表单状态 ---------- */
const form = reactive<{
  title: string
  desc: string
  categoryId: number | string
  tags: number[]
  status: ArticleStatus
  isPrivate: boolean
  isTop: boolean
  cover: string
  publishedAt: string
}>({
  title: '',
  desc: '',
  categoryId: '',
  tags: [],
  status: CArticleStatus.PUBLISHED,
  isPrivate: false,
  isTop: false,
  cover: '',
  publishedAt: ''
})

const publishNow = ref(true)
const coverUrlMode = ref(false)

/** 封面对应的 Media 记录 ID，用于删除/覆盖清理 */
const coverMediaId = ref<number | null>(null)
/** 封面上传中状态 */
const coverUploading = ref(false)

/* ---------- 暴露给父组件的状态 ---------- */

/** 是否可提交 */
const canSubmit = computed(() => !!props.userId && form.title.trim().length > 0)

/** 提交按钮文案 */
const submitLabel = computed(() =>
  form.status === CArticleStatus.PUBLISHED ? t('write.publish') : t('write.saveAsDraft')
)

/* ---------- 封面超限提示 ---------- */
function onCoverExceed() {
  UNotificationFn({ message: t('write.coverUploadHint'), type: 'warning' })
}

/**
 * 封面文件选取回调 —— 上传到服务端 Media 表，用 URL 替换 base64
 */
async function onCoverFileChange(file: UploadFile) {
  if (!file.raw) return

  // 立即用 base64 显示预览（即时反馈）
  form.cover = file.url
  coverUploading.value = true
  try {
    // 如果已有旧封面 Media，先异步清理（不阻塞新上传）
    const oldMediaId = coverMediaId.value
    if (oldMediaId) {
      deleteMedia(oldMediaId).catch(() => {})
      coverMediaId.value = null
    }

    const result = await uploadFile(file.raw)
    // 上传成功，替换为服务端 URL（通过 Vite 代理可访问）
    form.cover = result.url
    coverMediaId.value = result.mediaId
    savePublishSettingsDebounced()
  } catch (err) {
    UNotificationFn({
      message: err instanceof Error ? err.message : t('write.coverUploadFail'),
      type: 'error',
    })
    // 上传失败 → 清除预览
    form.cover = ''
  } finally {
    coverUploading.value = false
  }
}

/**
 * 封面删除回调 —— 删除服务端 Media 记录 + 物理文件
 */
async function onCoverRemove() {
  const oldMediaId = coverMediaId.value
  form.cover = ''
  coverMediaId.value = null
  savePublishSettingsDebounced()

  if (oldMediaId) {
    try {
      await deleteMedia(oldMediaId)
    } catch {
      // 清理失败不影响用户操作
    }
  }
}

/* ---------- 下拉选项 ---------- */
const statusOptions = computed(() => [
  { value: CArticleStatus.DRAFT, label: t('write.statusDraft') },
  { value: CArticleStatus.PUBLISHED, label: t('write.statusPublished') }
])

const categoryList = ref<ICategory[]>([])
const categoryOptions = computed(() => [
  { value: '', label: t('write.categoryPlaceholder') },
  ...categoryList.value.map((c) => ({ value: c.id, label: c.name }))
])

const tagList = ref<ITag[]>([])
const allTagOptions = computed(() =>
  tagList.value.map((tag) => ({ value: tag.id, label: tag.name }))
)

/* ---------- 从 Markdown 提取首个标题作为默认标题 ---------- */
function extractFirstHeading(mdContent: string): string {
  const m = mdContent.match(/^#+\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

/* ---------- 初始化表单 ---------- */
let initDone = false

async function initForm() {
  // 先尝试从本地缓存恢复发布配置
  const cached = await restorePublishSettings()
  if (cached) {
    form.title = cached.title || extractFirstHeading(props.content)
    form.desc = cached.desc || ''
    form.categoryId = cached.categoryId ?? ''
    form.tags = cached.tags ?? []
    form.status = (cached.status as ArticleStatus) || CArticleStatus.PUBLISHED
    form.isPrivate = cached.isPrivate ?? false
    form.isTop = cached.isTop ?? false
    form.cover = cached.cover || ''
    form.publishedAt = cached.publishedAt || toDatetimeLocal(new Date())
    publishNow.value = cached.publishNow ?? true
    coverUrlMode.value = cached.coverUrlMode ?? false
    coverMediaId.value = cached.coverMediaId ?? null
  } else {
    form.title = extractFirstHeading(props.content)
    form.desc = ''
    form.categoryId = ''
    form.tags = []
    form.status = CArticleStatus.PUBLISHED
    form.isPrivate = false
    form.isTop = false
    form.cover = ''
    form.publishedAt = toDatetimeLocal(new Date())
    publishNow.value = true
    coverMediaId.value = null
  }

  initDone = true
  loadCategories()
  loadTags()
}

/** 从 IndexedDB 恢复发布配置 */
async function restorePublishSettings(): Promise<PublishSettingsRecord | null> {
  try {
    return await getPublishSettings()
  } catch {
    return null
  }
}

/** 防抖保存发布配置到 IndexedDB */
let saveTimer: ReturnType<typeof setTimeout> | null = null
function savePublishSettingsDebounced() {
  if (!initDone) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    putPublishSettings({
      title: form.title,
      desc: form.desc,
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      tags: form.tags,
      status: form.status,
      isPrivate: form.isPrivate,
      isTop: form.isTop,
      cover: form.cover,
      coverMediaId: coverMediaId.value,
      publishedAt: form.publishedAt,
      publishNow: publishNow.value,
      coverUrlMode: coverUrlMode.value,
    }).catch(() => {})
    saveTimer = null
  }, 500)
}

onMounted(initForm)

/** content 变化时只更新标题（如果用户未手动修改过） */
watch(() => props.content, (newContent) => {
  if (initDone && form.title === '') {
    form.title = extractFirstHeading(newContent)
  }
})

watch(publishNow, (now) => {
  if (!now && !form.publishedAt) {
    form.publishedAt = toDatetimeLocal(new Date())
  }
  savePublishSettingsDebounced()
})

/** 监听表单字段变化，防抖保存 */
watch(
  () => [form.title, form.desc, form.categoryId, form.tags, form.status,
    form.isPrivate, form.isTop, form.cover, form.publishedAt, coverUrlMode.value],
  () => { savePublishSettingsDebounced() },
  { deep: true },
)

/* ---------- 数据加载 ---------- */
async function loadCategories() {
  try {
    const list = await api(CTable.CATEGORY).getCategoryList()
    categoryList.value = Array.isArray(list) ? list : []
  } catch {
    categoryList.value = []
  }
}

async function loadTags() {
  try {
    const list = await api(CTable.TAG).getTagList()
    tagList.value = Array.isArray(list) ? list : []
  } catch {
    tagList.value = []
  }
}

/* ---------- 提交处理 ---------- */
async function handleSubmit() {
  const title = form.title.trim()
  if (!title || !props.userId) return
  const publishedAt = publishNow.value
    ? new Date().toISOString()
    : form.publishedAt
      ? new Date(form.publishedAt).toISOString()
      : new Date().toISOString()
  const categoryId = form.categoryId === '' || form.categoryId == null
    ? undefined
    : Number(form.categoryId)
  const payload: WriteSaveFormPayload = {
    title,
    content: props.content,
    desc: form.desc.trim() || undefined,
    status: form.status,
    publishedAt,
    categoryId: categoryId ?? null,
    tags: form.tags.length > 0 ? form.tags : undefined,
    isPrivate: form.isPrivate,
    isTop: form.isTop,
    cover: form.cover || undefined
  }
  emit('submit', payload)
}

/** 发布成功后清理本地缓存（由父组件调用） */
function clearCache() {
  clearPublishSettings().catch(() => {})
}

defineExpose({
  /** 触发表单提交 */
  submit: handleSubmit,
  /** 是否可提交（标题非空 & 已登录） */
  canSubmit,
  /** 提交按钮文案 */
  submitLabel,
  /** 清理发布配置缓存 */
  clearCache,
})
</script>

<style lang="scss" scoped>
/* ====================================================================
   WriteSaveForm — UDrawer 内嵌表单，纯内容区，无 header/footer
   ==================================================================== */

/* ---------- 表单分区 ---------- */
.write-save-form__section {
  padding: 1rem 0;

  & + & {
    border-top: 1px solid var(--u-border-1, #ebeef5);
  }
}

.write-save-form__section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--u-text-2, #606266);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.write-save-form__section-icon {
  font-size: 0.8rem;
  color: var(--u-primary, #007bff);
}

.write-save-form__field-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  :deep(.u-form-item) {
    margin-bottom: 0;
  }

  :deep(.u-select) {
    width: 100%;
  }
}

/* ---------- 封面图区域 ---------- */
.write-save-form__cover-area {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* URL 模式切换 */
.write-save-form__cover-toggle {
  display: flex;
}

.write-save-form__cover-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--u-primary, #007bff);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.7;
  }
}

/* ---------- 发布时间 ---------- */
.write-save-form__publish-time {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.write-save-form__datetime-input {
  width: 100%;
}

/* ---------- 开关行 ---------- */
.write-save-form__switches {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* ---------- 提示信息 ---------- */
.write-save-form__hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--u-text-3, #999);
  font-size: 0.8125rem;
  margin: 0.5rem 0 0;
  padding: 0.5rem 0.75rem;
  background: var(--u-background-2, #fafafa);
  border-radius: var(--u-border-radius-4, 0.4rem);
}
</style>