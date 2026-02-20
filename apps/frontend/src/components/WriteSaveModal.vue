<template>
  <u-drawer
    :model-value="modelValue"
    :title="t('write.saveArticle')"
    placement="right"
    :width="420"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="write-save-modal__form" @submit.prevent="handleSubmit">
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
      <u-form-item :label="t('write.categoryPlaceholder')">
        <u-select
          v-model="form.categoryId"
          :options="categoryOptions"
          :placeholder="t('write.categoryPlaceholder')"
        />
      </u-form-item>
      <u-form-item :label="t('write.statusLabel')">
        <u-select
          v-model="form.status"
          :options="statusOptions"
          :placeholder="t('write.statusDraft')"
        />
      </u-form-item>
      <u-form-item>
        <div class="write-save-modal__switches">
          <label class="write-save-modal__switch">
            <input v-model="form.isPrivate" type="checkbox" />
            <span>{{ t('write.isPrivate') }}</span>
          </label>
          <label class="write-save-modal__switch">
            <input v-model="form.isTop" type="checkbox" />
            <span>{{ t('write.isTop') }}</span>
          </label>
        </div>
      </u-form-item>
      <p v-if="!userId" class="write-save-modal__hint">{{ t('write.loginRequired') }}</p>
      <div class="write-save-modal__footer">
        <u-button plain @click="handleClose">{{ t('common.cancel') }}</u-button>
        <u-button
          type="primary"
          :loading="loading"
          :disabled="!userId || !form.title.trim()"
          native-type="submit"
        >
          {{ form.status === CArticleStatus.PUBLISHED ? t('write.publish') : t('write.saveAsDraft') }}
        </u-button>
      </div>
    </form>
  </u-drawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CArticleStatus, type ArticleStatus } from '@u-blog/model'
import api from '@/api'
import { CTable } from '@u-blog/model'
import type { ICategory } from '@u-blog/model'

defineOptions({
  name: 'WriteSaveModal'
})

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    content: string
    userId?: number | null
    loading?: boolean
  }>(),
  {
    userId: null,
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: SubmitPayload): void
}>()

interface SubmitPayload {
  title: string
  content: string
  desc?: string
  status: string
  publishedAt: string
  categoryId?: number | null
  isPrivate: boolean
  isTop: boolean
}

const { t } = useI18n()

const form = reactive<{
  title: string
  desc: string
  categoryId: number | string
  status: ArticleStatus
  isPrivate: boolean
  isTop: boolean
}>({
  title: '',
  desc: '',
  categoryId: '',
  status: CArticleStatus.DRAFT,
  isPrivate: false,
  isTop: false
})

const statusOptions = computed(() => [
  { value: CArticleStatus.DRAFT, label: t('write.statusDraft') },
  { value: CArticleStatus.PUBLISHED, label: t('write.statusPublished') }
])

const categoryList = ref<ICategory[]>([])
const categoryOptions = computed(() => [
  { value: '', label: t('write.categoryPlaceholder') },
  ...categoryList.value.map((c) => ({ value: c.id, label: c.name }))
])

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.title = ''
      form.desc = ''
      form.categoryId = ''
      form.status = CArticleStatus.DRAFT
      form.isPrivate = false
      form.isTop = false
      loadCategories()
    }
  }
)

async function loadCategories() {
  try {
    const list = await api(CTable.CATEGORY).getCategoryList()
    categoryList.value = Array.isArray(list) ? list : []
  } catch {
    categoryList.value = []
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  const title = form.title.trim()
  if (!title) return
  if (!props.userId) return
  const publishedAt = new Date().toISOString()
  const categoryId = form.categoryId === '' || form.categoryId == null ? undefined : Number(form.categoryId)
  emit('submit', {
    title,
    content: props.content,
    desc: form.desc.trim() || undefined,
    status: form.status,
    publishedAt,
    categoryId: categoryId ?? null,
    isPrivate: form.isPrivate,
    isTop: form.isTop
  })
}
</script>

<style lang="scss" scoped>
.write-save-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.write-save-modal__switches {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.write-save-modal__switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  input {
    margin: 0;
  }
}

.write-save-modal__hint {
  color: var(--u-text-3, #999);
  font-size: 0.875rem;
  margin: 0;
}

.write-save-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
