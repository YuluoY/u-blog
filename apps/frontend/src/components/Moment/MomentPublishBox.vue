<template>
  <!--
    动态发布框 —— 仅博主（admin/super_admin）可见
    包含文本输入、图片上传、心情/天气/标签附加字段、图片布局选择
  -->
  <div class="moment-publish">
    <div class="moment-publish__card">
      <!-- 文本输入 -->
      <textarea
        ref="textareaRef"
        v-model="content"
        class="moment-publish__textarea"
        :placeholder="t('moments.publishPlaceholder')"
        rows="3"
        :maxlength="5000"
      />

      <!-- 已选图片预览 -->
      <div v-if="imageUrls.length > 0" class="moment-publish__images">
        <div
          v-for="(url, i) in imageUrls"
          :key="url"
          class="moment-publish__img-item"
        >
          <img :src="url" alt="" class="moment-publish__img-preview" />
          <button
            class="moment-publish__img-remove"
            @click="removeImage(i)"
            aria-label="移除图片"
          >
            <u-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <!-- 图片布局选择（多于 1 张时显示） -->
        <div v-if="imageUrls.length > 1" class="moment-publish__layout-select">
          <button
            v-for="opt in layoutOptions"
            :key="opt.value"
            class="moment-publish__layout-btn"
            :class="{ 'moment-publish__layout-btn--active': imageLayout === opt.value }"
            @click="imageLayout = opt.value"
            :title="opt.label"
          >
            <u-icon :icon="opt.icon" />
          </button>
        </div>
      </div>

      <!-- 附加字段 -->
      <div v-if="showExtras" class="moment-publish__extras">
        <!-- 心情 -->
        <div v-if="showMood" class="moment-publish__field">
          <label class="moment-publish__field-label">{{ t('moments.mood') }}</label>
          <input
            v-model="mood"
            class="moment-publish__field-input"
            :placeholder="t('moments.moodPlaceholder')"
            maxlength="50"
          />
        </div>
        <!-- 天气 -->
        <div v-if="showWeather" class="moment-publish__field">
          <label class="moment-publish__field-label">{{ t('moments.weather') }}</label>
          <input
            v-model="weather"
            class="moment-publish__field-input"
            :placeholder="t('moments.weatherPlaceholder')"
            maxlength="50"
          />
        </div>
        <!-- 标签 -->
        <div v-if="showTags" class="moment-publish__field">
          <label class="moment-publish__field-label">{{ t('moments.tags') }}</label>
          <input
            v-model="tagsInput"
            class="moment-publish__field-input"
            :placeholder="t('moments.tagsPlaceholder')"
          />
        </div>
      </div>

      <!-- 工具栏 + 发布按钮 -->
      <div class="moment-publish__toolbar">
        <div class="moment-publish__tools">
          <!-- 上传图片 -->
          <button class="moment-publish__tool-btn" @click="triggerUpload" :title="t('moments.addImage')">
            <u-icon icon="fa-solid fa-image" />
          </button>
          <!-- 心情 -->
          <button
            class="moment-publish__tool-btn"
            :class="{ 'moment-publish__tool-btn--active': showMood }"
            @click="showMood = !showMood"
            :title="t('moments.mood')"
          >
            <u-icon icon="fa-solid fa-face-smile" />
          </button>
          <!-- 天气 -->
          <button
            class="moment-publish__tool-btn"
            :class="{ 'moment-publish__tool-btn--active': showWeather }"
            @click="showWeather = !showWeather"
            :title="t('moments.weather')"
          >
            <u-icon icon="fa-solid fa-cloud-sun" />
          </button>
          <!-- 标签 -->
          <button
            class="moment-publish__tool-btn"
            :class="{ 'moment-publish__tool-btn--active': showTags }"
            @click="showTags = !showTags"
            :title="t('moments.tags')"
          >
            <u-icon icon="fa-solid fa-hashtag" />
          </button>
        </div>
        <button
          class="moment-publish__submit"
          :disabled="!canSubmit || publishing"
          @click="handlePublish"
        >
          <u-icon v-if="publishing" icon="fa-solid fa-spinner" spin />
          {{ publishing ? t('moments.publishing') : t('moments.publish') }}
        </button>
      </div>

      <!-- 隐藏的文件上传 input -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="moment-publish__file-input"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CMomentImageLayout, CMomentVisibility } from '@u-blog/model'
import type { MomentImageLayout, IMoment } from '@u-blog/model'
import { uploadFile } from '@/api/request'
import momentApis from '@/api/moment'
import { useMomentStore } from '@/stores/model/moment'
import { useUserStore } from '@/stores/model/user'

defineOptions({ name: 'MomentPublishBox' })

const { t } = useI18n()
const momentStore = useMomentStore()
const userStore = useUserStore()

/* ---------- 文本内容 ---------- */
const content = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

/* ---------- 图片上传 ---------- */
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageUrls = ref<string[]>([])
const imageLayout = ref<MomentImageLayout>(CMomentImageLayout.GRID)

const layoutOptions = [
  { value: CMomentImageLayout.GRID, label: '九宫格', icon: 'fa-solid fa-grip' },
  { value: CMomentImageLayout.LONG, label: '长图', icon: 'fa-solid fa-arrows-up-down' },
  { value: CMomentImageLayout.SCROLL, label: '横向滚动', icon: 'fa-solid fa-arrows-left-right' },
] as const

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  for (const file of Array.from(files)) {
    try {
      const result = await uploadFile(file)
      imageUrls.value.push(result.url)
    } catch {
      /* 上传失败静默忽略 */
    }
  }
  /* 重置 input，允许再次选择同一文件 */
  input.value = ''
}

function removeImage(index: number) {
  imageUrls.value.splice(index, 1)
}

/* ---------- 附加字段（按需展开） ---------- */
const showMood = ref(false)
const showWeather = ref(false)
const showTags = ref(false)
const mood = ref('')
const weather = ref('')
const tagsInput = ref('')

/** 至少有一个附加面板展开 */
const showExtras = computed(() => showMood.value || showWeather.value || showTags.value)

/* ---------- 发布 ---------- */
const publishing = ref(false)
const canSubmit = computed(() => content.value.trim().length > 0)

async function handlePublish() {
  if (!canSubmit.value || publishing.value) return
  publishing.value = true
  try {
    const tags = tagsInput.value
      .split(/[,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean)

    const payload: Partial<IMoment> = {
      content: content.value.trim(),
      userId: userStore.user?.id as number,
      visibility: CMomentVisibility.PUBLIC,
      isPinned: false,
      images: imageUrls.value.length > 0 ? imageUrls.value : null,
      imageLayout: imageUrls.value.length > 0 ? imageLayout.value : null,
      mood: mood.value.trim() || null,
      weather: weather.value.trim() || null,
      tags: tags.length > 0 ? tags : null,
    }

    const created = await momentApis.createMoment(payload)
    /* 发布成功：插入列表顶部并清空输入 */
    momentStore.prependMoment(created)
    resetForm()
  } finally {
    publishing.value = false
  }
}

function resetForm() {
  content.value = ''
  imageUrls.value = []
  imageLayout.value = CMomentImageLayout.GRID
  mood.value = ''
  weather.value = ''
  tagsInput.value = ''
  showMood.value = false
  showWeather.value = false
  showTags.value = false
}
</script>

<style scoped>
.moment-publish__card {
  background: var(--u-card-bg, #fff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.moment-publish__textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--u-border, #dcdfe6);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--u-text, #303133);
  background: var(--u-fill, #f5f7fa);
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.moment-publish__textarea:focus {
  border-color: var(--u-primary, #409eff);
}

/* 已选图片预览 */
.moment-publish__images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  align-items: flex-end;
}

.moment-publish__img-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.moment-publish__img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-publish__img-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.moment-publish__layout-select {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.moment-publish__layout-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--u-border, #dcdfe6);
  border-radius: 6px;
  background: var(--u-fill, #f5f7fa);
  color: var(--u-text-secondary, #909399);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.moment-publish__layout-btn--active {
  border-color: var(--u-primary, #409eff);
  color: var(--u-primary, #409eff);
  background: var(--u-primary-light, #ecf5ff);
}

/* 附加字段 */
.moment-publish__extras {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.moment-publish__field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.moment-publish__field-label {
  font-size: 13px;
  color: var(--u-text-secondary, #909399);
  white-space: nowrap;
}

.moment-publish__field-input {
  border: 1px solid var(--u-border, #dcdfe6);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--u-text, #303133);
  background: var(--u-fill, #f5f7fa);
  outline: none;
  width: 140px;
}

.moment-publish__field-input:focus {
  border-color: var(--u-primary, #409eff);
}

/* 工具栏 */
.moment-publish__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.moment-publish__tools {
  display: flex;
  gap: 4px;
}

.moment-publish__tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--u-text-secondary, #909399);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.15s;
}

.moment-publish__tool-btn:hover {
  color: var(--u-primary, #409eff);
  background: var(--u-fill-light, #f5f7fa);
}

.moment-publish__tool-btn--active {
  color: var(--u-primary, #409eff);
}

.moment-publish__submit {
  padding: 6px 20px;
  border: none;
  border-radius: 8px;
  background: var(--u-primary, #409eff);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.15s;
}

.moment-publish__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.moment-publish__submit:not(:disabled):hover {
  opacity: 0.85;
}

/* 隐藏文件上传 input */
.moment-publish__file-input {
  display: none;
}
</style>
