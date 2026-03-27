<template>
  <div class="announcement-detail">
    <!-- 加载中 -->
    <div v-if="loading" class="announcement-detail__loading">
      {{ t('announcement.loading') }}
    </div>

    <!-- 未找到 -->
    <div v-else-if="!announcement" class="announcement-detail__empty">
      <p>{{ t('announcement.notFound') }}</p>
      <router-link to="/home" class="announcement-detail__link">
        {{ t('announcement.backHome') }}
      </router-link>
    </div>

    <!-- 公告内容 -->
    <template v-else>
      <h1 class="announcement-detail__title">{{ announcement.title }}</h1>
      <time class="announcement-detail__time">{{ formatDate(announcement.createdAt) }}</time>

      <div class="announcement-detail__content">
        <MdPreview
          :model-value="announcement.content || ''"
          :theme="isDark ? 'dark' : 'light'"
          preview-theme="github"
          :code-theme="isDark ? 'github-dark' : 'github-light'"
          editor-id="announcement-preview"
        />
      </div>

      <router-link to="/home" class="announcement-detail__link">
        ← {{ t('announcement.back') }}
      </router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MdPreview } from 'md-editor-v3'
import { CTheme } from '@u-blog/model'
import { useAppStore } from '@/stores/app'
import { fetchAnnouncementById, type AnnouncementItem } from '@/api/announcement'
import 'md-editor-v3/lib/preview.css'
import { ensureMdEditorConfig } from '@/utils/mdEditorSetup'

ensureMdEditorConfig()

const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()

const announcement = ref<AnnouncementItem | null>(null)
const loading = ref(true)

/** 当前是否暗色模式 */
const isDark = computed(() => appStore.theme === CTheme.DARK)

/** 格式化日期 */
function formatDate(dateStr?: string)
{
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async() =>
{
  const id = Number(route.params.id)
  if (!id || isNaN(id))
  {
    loading.value = false
    return
  }
  try
  {
    announcement.value = await fetchAnnouncementById(id)
  }
  catch
  {
    // 获取失败
  }
  loading.value = false
})
</script>

<style lang="scss" scoped>
.announcement-detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px 60px;

  &__loading,
  &__empty {
    text-align: center;
    padding: 80px 0;
    color: var(--u-text-3);
    font-size: 14px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
    color: var(--u-text-1);
    line-height: 1.4;
  }

  &__time {
    display: block;
    margin-bottom: 24px;
    font-size: 13px;
    color: var(--u-text-3);
  }

  &__content {
    border-top: 1px solid var(--u-border-1);
    padding-top: 20px;

    :deep(.md-editor-preview-wrapper) {
      padding: 0;
    }

    :deep(.md-editor) {
      background: transparent;
    }
  }

  &__link {
    display: inline-block;
    margin-top: 32px;
    font-size: 13px;
    color: var(--u-primary);
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.7;
    }
  }
}

@media (max-width: 767px) {
  .announcement-detail {
    padding: 24px 16px 40px;

    &__title {
      font-size: 18px;
    }
  }
}
</style>
