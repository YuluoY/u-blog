<template>
  <u-form class="write-save-form" :class="`write-save-form--${layout}`" @submit.prevent="handleSubmit">
    <!-- 方案 D 极简：首行 标题 + 状态 + 操作 + 更多 -->
    <div v-if="layout === 'minimal'" class="write-save-form__minimal-row">
      <u-form-item :label="t('write.titlePlaceholder')" required class="write-save-form__minimal-title">
        <u-input
          v-model="form.title"
          :placeholder="t('write.titlePlaceholder')"
          :max-length="100"
          show-word-limit
        />
      </u-form-item>
      <u-form-item :label="t('write.statusLabel')" class="write-save-form__minimal-status">
        <div class="write-save-form__select-fw">
          <u-select
            v-model="form.status"
            :options="statusOptions"
            :placeholder="t('write.statusDraft')"
          />
        </div>
      </u-form-item>
      <div class="write-save-form__minimal-actions">
        <u-button
          type="primary"
          :loading="unref(loading)"
          :disabled="!userId || !form.title.trim()"
          native-type="submit"
        >
          {{ form.status === CArticleStatus.PUBLISHED ? t('write.publish') : t('write.saveAsDraft') }}
        </u-button>
        <u-button plain @click="minimalExpanded = !minimalExpanded">
          {{ minimalExpanded ? t('write.lessOptions') : t('write.moreOptions') }}
          <u-icon :icon="minimalExpanded ? ['fas', 'chevron-up'] : ['fas', 'chevron-down']" />
        </u-button>
      </div>
    </div>

    <!-- 方案 D 展开区 或 其他方案完整表单 -->
    <template v-if="layout !== 'minimal' || minimalExpanded">
      <!-- 基础信息：标题、描述（非 minimal 时标题描述在此） -->
      <div v-if="layout !== 'minimal'" class="write-save-form__base">
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
            :rows="layout === 'compact' ? 1 : 3"
            :max-length="255"
            show-word-limit
          />
        </u-form-item>
      </div>
      <div v-else class="write-save-form__base">
        <u-form-item :label="t('write.descPlaceholder')">
          <u-input
            v-model="form.desc"
            type="textarea"
            :placeholder="t('write.descPlaceholder')"
            :rows="2"
            :max-length="255"
            show-word-limit
          />
        </u-form-item>
      </div>

      <div class="write-save-form__meta">
        <u-form-item :label="t('write.categoryPlaceholder')">
          <div class="write-save-form__select-fw">
            <u-select
              v-model="form.categoryId"
              :options="categoryOptions"
              :placeholder="t('write.categoryPlaceholder')"
            />
          </div>
        </u-form-item>
        <u-form-item :label="t('write.tagsPlaceholder')">
          <div class="write-save-form__tags">
            <div class="write-save-form__tags-selected">
              <u-tag
                v-for="tagId in form.tags"
                :key="tagId"
                closable
                size="small"
                @close="removeTag(tagId)"
              >
                {{ getTagName(tagId) }}
              </u-tag>
            </div>
            <div class="write-save-form__select-fw">
              <u-select
                v-model="selectedTag"
                :options="tagOptions"
                :placeholder="t('write.tagsPlaceholder')"
                @update:model-value="addTag"
              />
            </div>
          </div>
        </u-form-item>
        <u-form-item :label="t('write.coverPlaceholder')">
          <div class="write-save-form__cover">
            <u-input
              v-model="form.cover"
              :placeholder="t('write.coverPlaceholder')"
            />
            <div v-if="form.cover" class="write-save-form__cover-preview">
              <img :src="form.cover" alt="cover" />
            </div>
          </div>
        </u-form-item>
      </div>

      <div class="write-save-form__publish-row">
        <u-form-item :label="t('write.publishTimeLabel')">
          <div class="write-save-form__publish-time">
            <u-checkbox v-model="publishNow" class="write-save-form__publish-now">
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
        <u-form-item :label="t('write.statusLabel')">
          <div class="write-save-form__select-fw">
            <u-select
              v-model="form.status"
              :options="statusOptions"
              :placeholder="t('write.statusDraft')"
            />
          </div>
        </u-form-item>
        <u-form-item>
          <div class="write-save-form__switches">
            <u-checkbox v-model="form.isPrivate">{{ t('write.isPrivate') }}</u-checkbox>
            <u-checkbox v-model="form.isTop">{{ t('write.isTop') }}</u-checkbox>
          </div>
        </u-form-item>
      </div>
    </template>

    <p v-if="!userId" class="write-save-form__hint">{{ t('write.loginRequired') }}</p>
    <div v-if="layout !== 'minimal'" class="write-save-form__footer">
      <u-button v-if="!inline" plain @click="handleClose">{{ t('common.cancel') }}</u-button>
      <u-button
        type="primary"
        :loading="unref(loading)"
        :disabled="!userId || !form.title.trim()"
        native-type="submit"
      >
        {{ form.status === CArticleStatus.PUBLISHED ? t('write.publish') : t('write.saveAsDraft') }}
      </u-button>
    </div>
  </u-form>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { reactive, ref, computed, watch, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CArticleStatus, type ArticleStatus } from '@u-blog/model'
import api from '@/api'
import { CTable } from '@u-blog/model'
import type { ICategory, ITag } from '@u-blog/model'

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
    /** 支持传入 Ref 以便函数式弹窗内响应式更新 */
    loading?: boolean | Ref<boolean>
    /** 内嵌模式（如写在编辑器上方）：不显示取消按钮 */
    inline?: boolean
    /** 表单布局：card | compact | grid | minimal，见 WriteViewFormLayouts.md */
    layout?: 'card' | 'compact' | 'grid' | 'minimal'
    /** 函数式弹窗时传入，用于关闭对话框 */
    onClose?: () => void
    /** 函数式弹窗时传入，提交成功后由调用方关闭 */
    onSubmit?: (payload: WriteSaveFormPayload) => void | Promise<void>
  }>(),
  {
    userId: null,
    loading: false,
    inline: false,
    layout: 'card'
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: WriteSaveFormPayload): void
  (e: 'close'): void
}>()

const { t } = useI18n()

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
  status: CArticleStatus.DRAFT,
  isPrivate: false,
  isTop: false,
  cover: '',
  publishedAt: ''
})

const publishNow = ref(true)
const selectedTag = ref<number | string>('')
const minimalExpanded = ref(false)

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
const tagOptions = computed(() => [
  { value: '', label: t('write.tagsPlaceholder') },
  ...tagList.value
    .filter((tag) => !form.tags.includes(tag.id))
    .map((tag) => ({ value: tag.id, label: tag.name }))
])

function getTagName(tagId: number): string {
  const tag = tagList.value.find((t) => t.id === tagId)
  return tag?.name ?? ''
}

function addTag(tagId: number | string) {
  if (tagId === '' || form.tags.includes(Number(tagId))) return
  form.tags.push(Number(tagId))
  selectedTag.value = ''
}

function removeTag(tagId: number) {
  const idx = form.tags.indexOf(tagId)
  if (idx > -1) form.tags.splice(idx, 1)
}

function extractFirstImage(mdContent: string): string {
  const m1 = mdContent.match(/!\[.*?\]\((.*?)\)/)
  if (m1?.[1]) return m1[1]
  const m2 = mdContent.match(/<img.*?src=["'](.*?)["']/)
  if (m2?.[1]) return m2[1]
  const m3 = mdContent.match(/data:image\/[^;]+;base64,[^\s"')]+/)
  if (m3?.[0]) return m3[0]
  return ''
}

function extractFirstHeading(mdContent: string): string {
  const m = mdContent.match(/^#+\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

function initForm() {
  form.title = extractFirstHeading(props.content)
  form.desc = ''
  form.categoryId = ''
  form.tags = []
  form.status = CArticleStatus.DRAFT
  form.isPrivate = false
  form.isTop = false
  form.cover = extractFirstImage(props.content)
  form.publishedAt = toDatetimeLocal(new Date())
  publishNow.value = true
  selectedTag.value = ''
  loadCategories()
  loadTags()
}

watch(() => props.content, initForm, { immediate: true })

watch(publishNow, (now) => {
  if (!now && !form.publishedAt) {
    form.publishedAt = toDatetimeLocal(new Date())
  }
})

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

function handleClose() {
  if (props.onClose) props.onClose()
  else emit('close')
}

async function handleSubmit() {
  const title = form.title.trim()
  if (!title) return
  if (!props.userId) return
  const publishedAt = publishNow.value
    ? new Date().toISOString()
    : form.publishedAt
      ? new Date(form.publishedAt).toISOString()
      : new Date().toISOString()
  const categoryId = form.categoryId === '' || form.categoryId == null ? undefined : Number(form.categoryId)
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
  if (props.onSubmit) {
    await props.onSubmit(payload)
  } else {
    emit('submit', payload)
  }
}
</script>

<style lang="scss" scoped>
/* 下拉项固定宽度，避免不同选项长度导致布局抖动 */
.write-save-form__select-fw {
  width: 160px;
  min-width: 160px;
  :deep(.u-select) {
    width: 100%;
  }
}

.write-save-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.write-save-form__tags {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.write-save-form__tags-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.write-save-form__cover {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.write-save-form__cover-preview {
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.write-save-form__publish-time {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.write-save-form__publish-now {
  align-self: flex-start;
}

.write-save-form__datetime-input {
  max-width: 280px;
  min-width: 200px;
}

.write-save-form__switches {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.write-save-form__hint {
  color: var(--u-text-3, #999);
  font-size: 0.875rem;
  margin: 0;
}

.write-save-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* ---------- 方案 A：卡片分区 ---------- */
.write-save-form--card {
  .write-save-form__base {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .write-save-form__meta {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--u-border-1, #eee);
  }
  .write-save-form__publish-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

/* ---------- 方案 B：单行紧凑 ---------- */
.write-save-form--compact {
  gap: 0.75rem;
  .write-save-form__base {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
    align-items: flex-start;
    .u-form-item {
      flex: 1 1 200px;
      margin-bottom: 0;
    }
    .u-form-item:first-child {
      min-width: 240px;
    }
  }
  .write-save-form__meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: flex-start;
    .u-form-item {
      margin-bottom: 0;
    }
  }
  .write-save-form__publish-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    align-items: center;
    .u-form-item {
      margin-bottom: 0;
    }
  }
  .write-save-form__footer {
    margin-top: 0.25rem;
  }
}

/* ---------- 方案 C：两列网格 ---------- */
.write-save-form--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
  .write-save-form__base {
    grid-column: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .write-save-form__meta {
    grid-column: 2;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .write-save-form__publish-row {
    grid-column: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .write-save-form__hint {
    grid-column: 1 / -1;
  }
  .write-save-form__footer {
    grid-column: 1 / -1;
    margin-top: 0.25rem;
  }
}

/* ---------- 方案 D：极简 + 折叠 ---------- */
.write-save-form--minimal {
  gap: 0.75rem;
  .write-save-form__minimal-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
    .write-save-form__minimal-title {
      flex: 1 1 200px;
      min-width: 180px;
      margin-bottom: 0;
    }
    .write-save-form__minimal-status {
      margin-bottom: 0;
    }
    .write-save-form__minimal-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }
  }
  .write-save-form__meta,
  .write-save-form__publish-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
