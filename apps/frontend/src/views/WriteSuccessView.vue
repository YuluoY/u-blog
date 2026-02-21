<template>
  <div class="write-success">
    <div class="write-success__card">
      <!-- 成功图标 -->
      <div class="write-success__icon">
        <u-icon :icon="['fas', 'circle-check']" />
      </div>

      <!-- 标题 -->
      <h1 class="write-success__title">{{ t('write.publishSuccessTitle') }}</h1>
      <p class="write-success__desc">{{ t('write.publishSuccessDesc') }}</p>

      <!-- 文章信息摘要 -->
      <div v-if="articleTitle" class="write-success__article-info">
        <span class="write-success__article-label">{{ t('write.titlePlaceholder') }}</span>
        <span class="write-success__article-value">{{ articleTitle }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="write-success__actions">
        <u-button type="primary" @click="goRead">
          <u-icon :icon="['fas', 'book-open']" />
          {{ t('write.goReadArticle') }}
        </u-button>
        <u-button plain @click="goWrite">
          <u-icon :icon="['fas', 'pen-nib']" />
          {{ t('write.continueWriting') }}
        </u-button>
        <u-button plain @click="goHome">
          <u-icon :icon="['fas', 'house']" />
          {{ t('write.backToHome') }}
        </u-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useArticleStore } from '@/stores/model/article'

defineOptions({ name: 'WriteSuccessView' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

// 发布成功后立即刷新文章列表，确保返回首页时能看到新文章
onMounted(() => {
  articleStore.qryArticleList()
})

/** 从路由 query 中取文章 ID 和标题 */
const articleId = computed(() => route.query.id as string | undefined)
const articleTitle = computed(() =>
  route.query.title ? decodeURIComponent(route.query.title as string) : ''
)

/** 阅读文章 */
function goRead() {
  if (articleId.value) {
    router.push({ name: 'read', params: { id: articleId.value } })
  }
}

/** 继续撰写 */
function goWrite() {
  router.push({ name: 'write' })
}

/** 返回首页 */
function goHome() {
  router.push({ name: 'home' })
}
</script>

<style lang="scss" scoped>
.write-success {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem;
}

.write-success__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  width: 100%;
  padding: 3rem 2.5rem;
  border-radius: 1rem;
  background: var(--u-background-1, #fff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  text-align: center;
}

/* 成功图标 */
.write-success__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: var(--u-success-light, #f0f9eb);
  color: var(--u-success, #67c23a);
  font-size: 2.25rem;
  margin-bottom: 1.5rem;
}

/* 标题 */
.write-success__title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--u-text-1, #303133);
}

.write-success__desc {
  margin: 0 0 1.75rem;
  font-size: 0.9375rem;
  color: var(--u-text-3, #909399);
  line-height: 1.5;
}

/* 文章信息 */
.write-success__article-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  margin-bottom: 2rem;
  border-radius: 0.5rem;
  background: var(--u-background-2, #f5f7fa);
  width: 100%;
  box-sizing: border-box;
}

.write-success__article-label {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--u-text-3, #909399);
  font-weight: 500;

  &::after {
    content: '：';
  }
}

.write-success__article-value {
  font-size: 0.875rem;
  color: var(--u-text-1, #303133);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.write-success__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;

  :deep(.u-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }
}
</style>
