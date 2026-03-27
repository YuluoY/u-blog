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
        <u-form-item>
          <template #label>
            <span class="write-save-form__label-with-action">
              {{ t('write.descPlaceholder') }}
              <button
                type="button"
                class="write-save-form__ai-desc-btn"
                :disabled="aiDescGenerating || !props.content.trim()"
                @click="onGenerateAiDesc"
              >
                <u-icon :icon="['fas', 'wand-magic-sparkles']" />
                {{ aiDescGenerating ? t('write.aiDescGenerating') : t('write.aiDescGenerate') }}
              </button>
            </span>
          </template>
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
          v-model="form.cover"
          accept="image/jpeg,image/png,image/webp,image/gif"
          :max-size="COVER_MAX_SIZE_MB"
          :placeholder="t('write.coverUpload')"
          aspect-ratio="16/9"
          :disabled="coverUploading"
          @change="onCoverFileChange"
          @remove="onCoverRemove"
          @exceed="onCoverExceed"
          @invalid="onCoverInvalid"
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
          <button
            type="button"
            class="write-save-form__cover-toggle-btn"
            :disabled="coverGenerating"
            @click="onGenerateCover"
          >
            <u-icon :icon="['fas', 'wand-magic-sparkles']" />
            {{ coverGenerating ? t('write.coverGenerating') : t('write.coverGenerate') }}
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
          <u-checkbox v-model="form.isProtected">{{ t('write.isProtected') }}</u-checkbox>
        </div>
        <!-- 密码保护输入（勾选后展开） -->
        <Transition name="slide-fade">
          <u-form-item v-if="form.isProtected" :label="t('write.protectPassword')" class="write-save-form__protect-field">
            <u-input
              v-model="form.protectPassword"
              type="password"
              :placeholder="t('write.protectPasswordPlaceholder')"
              :max-length="50"
              show-word-limit
              autocomplete="new-password"
            />
            <p class="write-save-form__protect-hint">
              <u-icon :icon="['fas', 'shield-halved']" />
              {{ t('write.protectHint') }}
            </p>
          </u-form-item>
        </Transition>
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
import { useAiGenerate } from '@/composables/useAiGenerate'
import type { ICategory, ITag } from '@u-blog/model'
import type { UploadFile } from '@u-blog/ui'
import { uploadFile, deleteMedia, generateCover } from '@/api/request'
import { getPublishSettings, putPublishSettings, clearPublishSettings, type PublishSettingsRecord } from '@/utils/publishSettingsDb'
import { encryptForTransport } from '@/utils/transportCrypto'

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
  /** 密码保护（加密后的密文，null 表示取消保护） */
  protect?: string | null
}

/** 日期格式化为 datetime-local 输入值 */
function toDatetimeLocal(d: Date): string
{
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
    /** 编辑模式：是否正在编辑已有文章 */
    editMode?: boolean
  }>(),
  {
    userId: null,
    editMode: false,
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: WriteSaveFormPayload): void
}>()

const { t } = useI18n()
const COVER_MAX_SIZE_MB = 10

/* ---------- 表单状态 ---------- */
const form = reactive<{
  title: string
  desc: string
  categoryId: number | string
  tags: number[]
  status: ArticleStatus
  isPrivate: boolean
  isTop: boolean
  isProtected: boolean
  protectPassword: string
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
  isProtected: false,
  protectPassword: '',
  cover: '',
  publishedAt: ''
})

const publishNow = ref(true)
const coverUrlMode = ref(false)

const { generating: aiDescGenerating, generate: generateAiText } = useAiGenerate()

/** 封面对应的 Media 记录 ID，用于删除/覆盖清理 */
const coverMediaId = ref<number | null>(null)
/** 封面上传中状态 */
const coverUploading = ref(false)
/** 封面生成中状态 */
const coverGenerating = ref(false)

/* ---------- 暴露给父组件的状态 ---------- */

/** 是否可提交 */
const canSubmit = computed(() => !!props.userId && form.title.trim().length > 0)

/** 提交按钮文案 */
const submitLabel = computed(() =>
{
  if (props.editMode) return t('write.updateArticle')
  return form.status === CArticleStatus.PUBLISHED ? t('write.publish') : t('write.saveAsDraft')
})

/* ---------- AI 生成描述 ---------- */
const AI_DESC_PROMPT = '你是一位专业的博客编辑。请根据以下文章内容，生成一段简洁的文章描述/摘要。要求：1. 不超过200字 2. 概括文章核心内容 3. 语言流畅自然 4. 适合在文章列表中展示。仅返回描述文本，不要任何前缀或解释。'

async function onGenerateAiDesc()
{
  if (!props.userId)
  {
    UNotificationFn({ message: t('write.loginRequired'), type: 'warning', deduplicate: true })
    return
  }
  const content = props.content.trim()
  if (!content)
  {
    UNotificationFn({ message: t('write.coverGenerateNoTitle'), type: 'warning', deduplicate: true })
    return
  }
  const result = await generateAiText('custom', content, undefined, AI_DESC_PROMPT)
  if (result)
  {
    suppressFieldTrack = true
    form.desc = result
    suppressFieldTrack = false
    descManuallyEdited = true
    savePublishSettingsDebounced()
    UNotificationFn({ message: t('write.aiDescGenerateSuccess'), type: 'success', deduplicate: true })
  }
}

/* ---------- 生成默认封面 ---------- */
async function onGenerateCover()
{
  const title = form.title.trim() || extractAutoTitle(props.content)
  if (!title)
  {
    UNotificationFn({ message: t('write.coverGenerateNoTitle'), type: 'warning', deduplicate: true })
    return
  }
  coverGenerating.value = true
  try
  {
    // 清理旧封面 Media（若存在）
    const oldMediaId = coverMediaId.value
    if (oldMediaId)
    {
      deleteMedia(oldMediaId).catch(() =>
      {})
      coverMediaId.value = null
    }
    const url = await generateCover(title)
    form.cover = url
    coverMediaId.value = null // 生成封面不经过 Media 表
    coverManuallyEdited = true
    savePublishSettingsDebounced()
    UNotificationFn({ message: t('write.coverGenerateSuccess'), type: 'success', deduplicate: true })
  }
  catch (err)
  {
    UNotificationFn({
      message: err instanceof Error ? err.message : t('write.coverGenerateFail'),
      type: 'error',
      deduplicate: true,
    })
  }
  finally
  {
    coverGenerating.value = false
  }
}

/* ---------- 封面超限提示 ---------- */
function onCoverExceed()
{
  UNotificationFn({
    message: t('write.coverUploadTooLarge', { size: COVER_MAX_SIZE_MB }),
    type: 'warning',
    deduplicate: true,
  })
}

function onCoverInvalid()
{
  UNotificationFn({
    message: t('write.coverUploadInvalidType'),
    type: 'warning',
    deduplicate: true,
  })
}

/**
 * 封面文件选取回调 —— 上传到服务端 Media 表，用 URL 替换 base64
 */
async function onCoverFileChange(file: UploadFile)
{
  if (!file.raw) return

  // 立即用 base64 显示预览（即时反馈）
  form.cover = file.url
  coverUploading.value = true
  try
  {
    // 如果已有旧封面 Media，先异步清理（不阻塞新上传）
    const oldMediaId = coverMediaId.value
    if (oldMediaId)
    {
      deleteMedia(oldMediaId).catch(() =>
      {})
      coverMediaId.value = null
    }

    const result = await uploadFile(file.raw)
    // 上传成功，替换为服务端 URL（通过 Vite 代理可访问）
    form.cover = result.url
    coverMediaId.value = result.mediaId
    savePublishSettingsDebounced()
  }
  catch (err)
  {
    UNotificationFn({
      message: err instanceof Error ? err.message : t('write.coverUploadFail'),
      type: 'error',
      deduplicate: true,
    })
    // 上传失败 → 清除预览
    form.cover = ''
  }
  finally
  {
    coverUploading.value = false
  }
}

/**
 * 封面删除回调 —— 删除服务端 Media 记录 + 物理文件
 */
async function onCoverRemove()
{
  const oldMediaId = coverMediaId.value
  form.cover = ''
  coverMediaId.value = null
  savePublishSettingsDebounced()

  if (oldMediaId)
  {
    try
    {
      await deleteMedia(oldMediaId)
    }
    catch
    {
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
  ...categoryList.value.map(c => ({ value: c.id, label: c.name }))
])

const tagList = ref<ITag[]>([])
const allTagOptions = computed(() =>
  tagList.value.map(tag => ({ value: tag.id, label: tag.name }))
)

/* ---------- 从 Markdown 提取首个一级标题作为默认标题 ---------- */
function extractFirstHeading(mdContent: string): string
{
  const m = mdContent.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

/**
 * 每次发布时自动提取标题：优先首个 Markdown 标题，其次正文摘要前 60 字
 */
function extractAutoTitle(mdContent: string): string
{
  const heading = extractFirstHeading(mdContent)
  if (heading) return heading
  const fallback = extractSummary(mdContent, 60)
  return fallback.replace(/\.\.\.$/, '').trim()
}

/**
 * 从 Markdown 内容提取简介：
 * 去除标题、图片、链接、代码块、HTML 标签等标记，取前 200 个有效字符
 */
function extractSummary(mdContent: string, maxLen = 200): string
{
  let text = mdContent
    // 移除代码块（```...```）
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]+`/g, '')
    // 移除图片（![alt](url)）
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // 移除链接，保留文字
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 移除标题行
    .replace(/^#{1,6}\s+.*$/gm, '')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除引用标记
    .replace(/^>\s?/gm, '')
    // 移除加粗、斜体、删除线标记
    .replace(/[*_~]{1,3}/g, '')
    // 移除分割线
    .replace(/^[-*_]{3,}$/gm, '')
    // 压缩空白
    .replace(/\n{2,}/g, '\n')
    .trim()
  // 取前 maxLen 个字符
  if (text.length > maxLen)
  
    text = text.slice(0, maxLen) + '...'
  
  return text
}

/**
 * 从 Markdown 内容提取首张图片 URL 作为封面图
 * 支持 ![alt](url) 和 <img src="url"> 两种格式
 * 排除 base64 data URI（体积过大，不适合做封面）
 */
function extractFirstImage(mdContent: string): string
{
  // 匹配所有 Markdown 图片语法
  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = mdImgRe.exec(mdContent)) !== null)
  {
    const url = match[1].trim()
    // 跳过 base64 data URI
    if (!url.startsWith('data:')) return url
  }
  // 匹配所有 HTML img 标签
  const htmlImgRe = /<img[^>]+src=["']([^"']+)["']/gi
  while ((match = htmlImgRe.exec(mdContent)) !== null)
  {
    const url = match[1].trim()
    if (!url.startsWith('data:')) return url
  }
  return ''
}

/* ---------- 初始化表单 ---------- */
let initDone = false
let suppressFieldTrack = false

async function initForm()
{
  // 编辑模式下跳过缓存恢复，等待父组件调用 loadEditData
  if (props.editMode)
  {
    initDone = true
    loadCategories()
    loadTags()
    return
  }

  // 先尝试从本地缓存恢复发布配置
  const cached = await restorePublishSettings()
  if (cached)
  {
    form.title = cached.title || extractFirstHeading(props.content)
    // 自动提取简介：仅当缓存中无简介且有内容时自动填充
    form.desc = cached.desc || extractSummary(props.content)
    form.categoryId = cached.categoryId ?? ''
    form.tags = cached.tags ?? []
    form.status = (cached.status as ArticleStatus) || CArticleStatus.PUBLISHED
    form.isPrivate = cached.isPrivate ?? false
    form.isTop = cached.isTop ?? false
    // 自动提取封面图：仅当缓存中无封面且有内容时自动填充（过滤临时 blob/data URL）
    form.cover = sanitizeCoverUrl(cached.cover || '') || extractFirstImage(props.content)
    form.publishedAt = cached.publishedAt || toDatetimeLocal(new Date())
    publishNow.value = cached.publishNow ?? true
    coverUrlMode.value = cached.coverUrlMode ?? false
    coverMediaId.value = cached.coverMediaId ?? null
    form.isProtected = cached.isProtected ?? false
    form.protectPassword = cached.protectPassword ?? ''
    titleManuallyEdited = cached.titleManuallyEdited ?? false
    descManuallyEdited = cached.descManuallyEdited ?? false
    coverManuallyEdited = cached.coverManuallyEdited ?? false
  }
  else
  {
    form.title = extractFirstHeading(props.content)
    // 新建模式：自动提取简介和封面图
    form.desc = extractSummary(props.content)
    form.categoryId = ''
    form.tags = []
    form.status = CArticleStatus.PUBLISHED
    form.isPrivate = false
    form.isTop = false
    form.isProtected = false
    form.protectPassword = ''
    form.cover = extractFirstImage(props.content)
    form.publishedAt = toDatetimeLocal(new Date())
    publishNow.value = true
    coverMediaId.value = null
    titleManuallyEdited = false
    descManuallyEdited = false
    coverManuallyEdited = false
  }

  initDone = true
  loadCategories()
  loadTags()
}

/** 从 IndexedDB 恢复发布配置 */
async function restorePublishSettings(): Promise<PublishSettingsRecord | null>
{
  try
  {
    return await getPublishSettings()
  }
  catch
  {
    return null
  }
}

/** 防抖保存发布配置到 IndexedDB */
let saveTimer: ReturnType<typeof setTimeout> | null = null
function savePublishSettingsDebounced()
{
  if (!initDone) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() =>
  {
    putPublishSettings({
      title: form.title,
      desc: form.desc,
      titleManuallyEdited,
      descManuallyEdited,
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      tags: form.tags,
      status: form.status,
      isPrivate: form.isPrivate,
      isTop: form.isTop,
      cover: sanitizeCoverUrl(form.cover),
      coverManuallyEdited,
      coverMediaId: coverMediaId.value,
      publishedAt: form.publishedAt,
      publishNow: publishNow.value,
      coverUrlMode: coverUrlMode.value,
      isProtected: form.isProtected,
      protectPassword: form.protectPassword,
    }).catch(() =>
    {})
    saveTimer = null
  }, 500)
}

onMounted(initForm)

/** content 变化时自动补全标题、简介和封面图（仅当用户未手动填写时） */
/** 记录用户是否手动修改过标题 / 简介 / 封面，避免覆盖用户输入 */
let titleManuallyEdited = false
let descManuallyEdited = false
let coverManuallyEdited = false

watch(() => form.title, () =>
{
  if (initDone && !suppressFieldTrack) titleManuallyEdited = true
})
watch(() => form.desc, () =>
{
  if (initDone && !suppressFieldTrack) descManuallyEdited = true
})
watch(() => form.cover, () =>
{
  if (initDone && !suppressFieldTrack) coverManuallyEdited = true
})

watch(() => props.content, newContent =>
{
  if (!initDone) return
  // 用户未手动编辑过标题时，跟随内容一级标题同步
  if (!titleManuallyEdited)
  {
    const heading = extractFirstHeading(newContent)
    if (heading) form.title = heading
  }
  // 用户未手动编辑过简介时，跟随内容摘要同步
  if (!descManuallyEdited)
  {
    const summary = extractSummary(newContent)
    if (summary) form.desc = summary
  }
  // 用户未手动编辑过封面时，跟随内容首张图片同步
  if (!coverManuallyEdited)
  {
    const img = extractFirstImage(newContent)
    if (img) form.cover = img
  }
})

watch(publishNow, now =>
{
  if (!now && !form.publishedAt)
  
    form.publishedAt = toDatetimeLocal(new Date())
  
  savePublishSettingsDebounced()
})

/** 监听表单字段变化，防抖保存 */
watch(
  () => [form.title, form.desc, form.categoryId, form.tags, form.status,
    form.isPrivate, form.isTop, form.isProtected, form.protectPassword, form.cover, form.publishedAt, coverUrlMode.value],
  () =>
  {
    savePublishSettingsDebounced()
  },
  { deep: true },
)

/* ---------- 数据加载 ---------- */
async function loadCategories()
{
  try
  {
    const list = await api(CTable.CATEGORY).getCategoryList()
    categoryList.value = Array.isArray(list) ? list : []
  }
  catch
  {
    categoryList.value = []
  }
}

async function loadTags()
{
  try
  {
    const list = await api(CTable.TAG).getTagList()
    tagList.value = Array.isArray(list) ? list : []
  }
  catch
  {
    tagList.value = []
  }
}

/**
 * 过滤掉临时预览 URL（blob: / data:），只保留有效的服务端地址
 */
function sanitizeCoverUrl(url: string): string
{
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return ''
  return trimmed
}

/* ---------- 提交处理 ---------- */
async function handleSubmit()
{
  if (!props.userId) return
  // 封面仍在上传中，阻止提交
  if (coverUploading.value)
  {
    UNotificationFn({
      message: t('write.coverUploading'),
      type: 'warning',
      deduplicate: true,
    })
    return
  }
  const autoTitle = extractAutoTitle(props.content)
  if (!autoTitle && !form.title.trim()) return
  const autoDesc = extractSummary(props.content)
  const autoCover = sanitizeCoverUrl(extractFirstImage(props.content))

  const resolvedTitle = form.title.trim() || autoTitle
  const resolvedDesc = descManuallyEdited
    ? form.desc.trim()
    : form.desc.trim() || autoDesc
  const resolvedCover = coverManuallyEdited
    ? sanitizeCoverUrl(form.cover)
    : sanitizeCoverUrl(form.cover) || autoCover

  // 仅补齐缺失字段，保留用户手动修改/替换的值
  form.title = resolvedTitle
  form.desc = resolvedDesc
  form.cover = resolvedCover

  const publishedAt = publishNow.value
    ? new Date().toISOString()
    : form.publishedAt
      ? new Date(form.publishedAt).toISOString()
      : new Date().toISOString()
  const categoryId = form.categoryId === '' || form.categoryId == null
    ? undefined
    : Number(form.categoryId)

  // 密码保护：勾选且填写了密码则加密传输，否则传 null 表示取消
  let encryptedProtect: string | null = null
  if (form.isProtected && form.protectPassword.trim())
  
    encryptedProtect = await encryptForTransport(form.protectPassword.trim())
  

  const payload: WriteSaveFormPayload = {
    title: resolvedTitle,
    content: props.content,
    desc: resolvedDesc || undefined,
    status: form.status,
    publishedAt,
    categoryId: categoryId ?? null,
    tags: form.tags.length > 0 ? form.tags : undefined,
    isPrivate: form.isPrivate,
    isTop: form.isTop,
    cover: resolvedCover || undefined,
    protect: encryptedProtect,
  }
  emit('submit', payload)
}

/**
 * 每次打开发布抽屉时，根据当前正文重新同步标题与简介。
 * 用户显式要求“打开即同步”，因此这里以正文提取结果为准。
 */
function syncDraftMetaFromContent()
{
  const nextTitle = extractFirstHeading(props.content)
  const nextDesc = extractSummary(props.content)
  const nextCover = extractFirstImage(props.content)

  suppressFieldTrack = true
  if (!titleManuallyEdited && nextTitle)
    form.title = nextTitle
  if (!descManuallyEdited && nextDesc)
    form.desc = nextDesc
  if (!coverManuallyEdited && nextCover)
    form.cover = nextCover
  suppressFieldTrack = false
  savePublishSettingsDebounced()
}

/**
 * 编辑模式：加载已有文章数据到表单
 * @param article 文章完整对象
 */
function loadEditData(article: {
  title: string
  desc?: string
  categoryId?: number | null
  tags?: Array<{ id: number }> | number[]
  status?: string
  isPrivate?: boolean
  isTop?: boolean
  cover?: string
  publishedAt?: string
  /** 密码保护（超级管理员编辑时后端会返回明文） */
  protect?: string | null
  /** 是否受密码保护（前端标记） */
  isProtected?: boolean
})
{
  form.title = article.title || ''
  form.desc = article.desc || ''
  form.categoryId = article.categoryId ?? ''
  // tags 可能是对象数组 [{id:1}] 或纯 id 数组
  form.tags = (article.tags ?? []).map((t: any) => typeof t === 'object' ? t.id : t)
  form.status = (article.status as ArticleStatus) || CArticleStatus.PUBLISHED
  form.isPrivate = article.isPrivate ?? false
  form.isTop = article.isTop ?? false
  form.cover = article.cover || ''
  /**
   * 编辑现有文章时，封面已经是持久化数据，不应该继续继承新建草稿阶段缓存的 mediaId。
   * 否则后续“重新上传/生成封面”会把旧草稿 mediaId 当成当前封面去删，误伤其他文章正在使用的文件。
   */
  coverMediaId.value = null
  titleManuallyEdited = !!form.title
  descManuallyEdited = !!form.desc
  coverManuallyEdited = !!form.cover
  // 密码保护：超管编辑时后端返回明文 protect，否则通过 isProtected 标记还原状态
  form.isProtected = !!(article.protect || article.isProtected)
  form.protectPassword = article.protect || ''
  if (article.publishedAt)
  {
    form.publishedAt = toDatetimeLocal(new Date(article.publishedAt))
    publishNow.value = false
  }
  else
  
    publishNow.value = true
  
}

/** 发布成功后清理本地缓存（由父组件调用） */
function clearCache()
{
  clearPublishSettings().catch(() =>
  {})
}

defineExpose({
  /** 触发表单提交 */
  submit: handleSubmit,
  /** 打开发布抽屉时同步正文提取的标题/简介 */
  syncDraftMetaFromContent,
  /** 是否可提交（标题非空 & 已登录） */
  canSubmit,
  /** 提交按钮文案 */
  submitLabel,
  /** 清理发布配置缓存 */
  clearCache,
  /** 编辑模式：加载已有文章数据 */
  loadEditData,
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

.write-save-form__label-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.write-save-form__ai-desc-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--u-primary, #007bff);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--u-primary-light-9, #e6f2ff);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  gap: 0.5rem;
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

/* ---------- 密码保护字段 ---------- */
.write-save-form__protect-field {
  margin-top: 0.5rem;
}

.write-save-form__protect-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  color: var(--u-text-3, #999);
  line-height: 1.4;
}

/* ---------- 展开/收起过渡 ---------- */
.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
