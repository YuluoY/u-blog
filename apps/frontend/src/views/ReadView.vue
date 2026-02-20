<template>
  <u-layout class="read-view-layout">
    <u-region region="center" class="read-view__center">
      <div class="read-view__body">
        <div class="read-view__content">
          <header v-if="article" class="read-view__meta" role="doc-subtitle">
            <div class="read-view__meta-top">
              <div class="read-view__meta-taxonomy">
                <span v-if="article.category" class="read-view__meta-category">{{ article.category.name }}</span>
                <template v-if="article.tags?.length">
                  <span v-for="tag in article.tags" :key="tag.id" class="read-view__meta-tag" :style="tag.color ? { borderColor: tag.color, color: tag.color } : undefined">{{ tag.name }}</span>
                </template>
              </div>
              <div class="read-view__meta-byline">
                <span v-if="article.user" class="read-view__meta-author">{{ article.user.namec || article.user.username }}</span>
                <time v-if="article.publishedAt" class="read-view__meta-date" :datetime="toIso(article.publishedAt)">{{ t('read.publishedAt') }} {{ formatDate(article.publishedAt) }}</time>
                <time v-if="article.updatedAt" class="read-view__meta-date" :datetime="toIso(article.updatedAt)">{{ t('read.updatedAt') }} {{ formatDate(article.updatedAt) }}</time>
              </div>
            </div>
            <dl class="read-view__meta-stats">
              <div class="read-view__meta-stat"><dt>{{ t('read.words') }}</dt><dd>{{ wordCount }}</dd></div>
              <div class="read-view__meta-stat"><dt>{{ t('read.read') }}</dt><dd>~ {{ readingMinutes }} {{ t('read.minutes') }}</dd></div>
              <div v-if="article.viewCount != null" class="read-view__meta-stat"><dt>{{ t('read.viewCount') }}</dt><dd>{{ article.viewCount }}</dd></div>
              <div v-if="article.likeCount != null" class="read-view__meta-stat"><dt>{{ t('read.like') }}</dt><dd>{{ article.likeCount }}</dd></div>
              <div v-if="article.commentCount != null" class="read-view__meta-stat"><dt>{{ t('read.comment') }}</dt><dd>{{ article.commentCount }}</dd></div>
            </dl>
          </header>
          <component v-if="Preview && articleContent" :is="Preview" :key="route.params.id" />
          <nav v-if="prevArticle || nextArticle" class="read-view__nav" aria-label="上下篇">
            <router-link v-if="prevArticle" :to="`/read/${prevArticle.id}`" class="read-view__nav-link read-view__nav-link--prev">
              <span class="read-view__nav-label">{{ t('read.prev') }}</span>
              <span class="read-view__nav-title">{{ prevArticle.title }}</span>
            </router-link>
            <span v-else class="read-view__nav-placeholder" />
            <router-link v-if="nextArticle" :to="`/read/${nextArticle.id}`" class="read-view__nav-link read-view__nav-link--next">
              <span class="read-view__nav-label">{{ t('read.next') }}</span>
              <span class="read-view__nav-title">{{ nextArticle.title }}</span>
            </router-link>
            <span v-else class="read-view__nav-placeholder" />
          </nav>

          <!-- 评论区：按 path=/read/:id 拉取与发表，支持懒加载 -->
          <section v-if="commentPath" class="read-view__comments" aria-label="评论区">
            <u-comment :title="t('read.commentSection')" :show-title="true">
              <template v-if="user?.id">
                <u-comment-input
                  v-model="commentContent"
                  :placeholder="t('read.commentPlaceholder')"
                  :max-length="500"
                  :submit-text="t('read.commentSubmit')"
                  :loading="commentSubmitting"
                  :emoji-picker-theme="appStore.theme === CTheme.DARK ? 'dark' : 'light'"
                  @insert="commentContent += $event"
                  @submit="handleCommentSubmit"
                />
              </template>
              <div v-else class="read-view__comment-login-hint">
                <u-icon icon="fa-regular fa-user" />
                <span>{{ t('read.loginToComment') }}</span>
              </div>
              <u-comment-list
                :list="(commentListByPath as unknown as UCommentItemData[])"
                :loading="commentLoading"
                :empty-text="t('read.emptyComments')"
                :plain-content="false"
                :replying-id="replyingId"
                :reply-content="replyContent"
                :reply-loading="replySubmitting"
                :logged-in="!!user?.id"
                @reply="handleReply"
                @reply-submit="handleReplySubmit"
                @reply-cancel="handleReplyCancel"
                @update:reply-content="replyContent = $event"
                @scroll-to="scrollToComment"
              />
              <div
                v-if="commentHasMore && !commentLoading && commentListByPath.length > 0"
                class="read-view__comment-load-more"
              >
                <button
                  type="button"
                  class="read-view__comment-load-more-btn"
                  :disabled="commentLoading"
                  @click="loadMoreComments"
                >
                  {{ t('read.loadMoreComments') }}
                </button>
              </div>
            </u-comment>
          </section>
        </div>
        <aside class="read-view__catalog" :aria-label="t('read.catalog')">
          <component
            v-if="Catalog"
            :is="Catalog"
            :key="`${route.params.id}-${scrollElement ? 'm' : 'd'}`"
            :scroll-element="scrollElement"
          />
        </aside>
      </div>
    </u-region>
  </u-layout>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { usePreviewMd } from '@/composables/usePreviewMd'
import { useArticleStore } from '@/stores/model/article'
import { useCommentStore } from '@/stores/model/comment'
import { useUserStore } from '@/stores/model/user'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { watch, computed, nextTick } from 'vue'
import api from '@/api'
import { CTable, CTheme } from '@u-blog/model'
import type { UCommentItemData } from '@u-blog/ui'

defineOptions({
  name: 'ReadView'
})

const { t } = useI18n()
const route = useRoute()
const articleStore = useArticleStore()
const commentStore = useCommentStore()
const userStore = useUserStore()
const appStore = useAppStore()
const { currentArticle, articleList } = storeToRefs(articleStore)
const { user } = storeToRefs(userStore)

const { Preview, Catalog, articleContent, scrollElement } = usePreviewMd({ articleId: route.params.id as string })

const article = computed(() => {
  const id = route.params.id as string
  const found = articleStore.findArticleById(id)
  if (found) return found
  const cur = currentArticle.value
  if (cur && (String(cur.id) === id || cur.id === parseInt(id))) return cur
  return null
})

const wordCount = computed(() => {
  const text = articleContent.value ?? ''
  return text.replace(/[#*_~`\[\]()!\\]/g, '').replace(/\s+/g, '').length
})

const readingMinutes = computed(() => {
  const n = wordCount.value
  return Math.max(1, Math.round(n / 300))
})

const prevArticle = computed(() => {
  const list = articleList.value
  const id = route.params.id as string
  const idx = list.findIndex(a => String(a.id) === id || a.id === parseInt(id))
  return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null
})

const nextArticle = computed(() => {
  const list = articleList.value
  const id = route.params.id as string
  const idx = list.findIndex(a => String(a.id) === id || a.id === parseInt(id))
  return idx > 0 ? list[idx - 1] : null
})

// 评论区：path 与 store 按 path 的状态
const commentPath = computed(() => (route.params.id ? `/read/${route.params.id}` : ''))
const commentListByPath = computed(() =>
  commentPath.value ? commentStore.getState(commentPath.value).list : []
)
const commentLoading = computed(() =>
  commentPath.value ? commentStore.getState(commentPath.value).loading : false
)
const commentHasMore = computed(() =>
  commentPath.value ? commentStore.getState(commentPath.value).hasMore : false
)

const commentContent = ref('')
const commentSubmitting = ref(false)
const replyingId = ref<number | null>(null)
const replyContent = ref('')
const replySubmitting = ref(false)

/** 进入文章页或切换文章时拉取该 path 的评论第一页 */
watch(
  commentPath,
  (path) => {
    if (path) commentStore.qryCommentListByPath(path, false)
  },
  { immediate: true }
)

/** 发表主评论 */
async function handleCommentSubmit() {
  const text = commentContent.value?.trim()
  if (!text || !user.value?.id || !commentPath.value) return
  commentSubmitting.value = true
  try {
    const id = route.params.id as string
    const articleId = id ? parseInt(id, 10) : undefined
    await api(CTable.COMMENT).addComment({
      content: text,
      path: commentPath.value,
      userId: user.value.id as number,
      articleId: Number.isNaN(articleId) ? undefined : articleId
    })
    commentContent.value = ''
    // 重新拉取第一页以包含新评论（服务端排序一致）
    await commentStore.qryCommentListByPath(commentPath.value, false)
    // 同步当前文章评论数展示
    if (article.value) {
      articleStore.setCurrentArticle({
        ...article.value,
        commentCount: (article.value.commentCount ?? 0) + 1
      })
    }
  } finally {
    commentSubmitting.value = false
  }
}

function handleReply(comment: UCommentItemData) {
  replyingId.value = comment.id
  replyContent.value = ''
}

async function handleReplySubmit(text: string, comment: UCommentItemData) {
  if (!text.trim() || !user.value?.id || !commentPath.value) return
  replySubmitting.value = true
  try {
    await api(CTable.COMMENT).addComment({
      content: text.trim(),
      path: commentPath.value,
      userId: user.value.id as number,
      pid: comment.id
    })
    replyContent.value = ''
    replyingId.value = null
    await commentStore.qryCommentListByPath(commentPath.value, false)
    if (article.value) {
      articleStore.setCurrentArticle({
        ...article.value,
        commentCount: (article.value.commentCount ?? 0) + 1
      })
    }
  } finally {
    replySubmitting.value = false
  }
}

function handleReplyCancel() {
  replyingId.value = null
  replyContent.value = ''
}

function scrollToComment(commentId: number) {
  nextTick(() => {
    const el = document.querySelector(`[data-comment-id="${commentId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function loadMoreComments() {
  if (commentPath.value && commentHasMore.value && !commentLoading.value) {
    commentStore.qryCommentListByPath(commentPath.value, true)
  }
}

function formatDate (d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function toIso (d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

watch(() => route.params.id, () => {
  nextTick(() => {
    const main = document.querySelector('.layout-base__main')
    if (main) main.scrollTop = 0
  })
}, { immediate: true })
</script>

<style lang="scss" scoped>
/* 让内容区随正文增高，由 .layout-base__main 统一滚动，避免被 u-layout 的 overflow:hidden 裁切 */
.read-view-layout {
  overflow: visible;
  min-height: 100%;
  height: auto;
  :deep(.u-layout__body) {
    min-height: 0;
    flex: 1 1 auto;
  }
  :deep(.u-region__center) {
    min-height: auto;
  }
}

.read-view__body {
  display: flex;
  gap: 24px;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
}

.read-view__content {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.read-view__meta {
  margin-bottom: 0;
  padding: 0 0 20px;
  border-bottom: 1px solid var(--u-border-1);

  &-top {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px 24px;
    margin-bottom: 16px;
  }
  &-taxonomy {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  &-category {
    font-size: 1.2rem;
    padding: 3px 10px;
    background: var(--u-border-1);
    color: var(--u-text-2);
    border-radius: 6px;
    font-weight: 500;
  }
  &-tag {
    font-size: 1.15rem;
    padding: 2px 8px;
    border: 1px solid var(--u-border-2);
    color: var(--u-text-2);
    border-radius: 4px;
  }
  &-byline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    font-size: 1.25rem;
    color: var(--u-text-3);
  }
  &-author {
    color: var(--u-text-2);
    font-weight: 500;
  }
  &-date {
    font-size: 1.2rem;
    color: var(--u-text-3);
  }
  &-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
    gap: 12px 24px;
    margin: 0;
  }
  &-stat {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
    dt {
      font-size: 1.1rem;
      color: var(--u-text-4, var(--u-text-3));
      font-weight: normal;
    }
    dd {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 500;
      color: var(--u-text-2);
    }
  }
}

.read-view__nav {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--u-border-1);
  min-width: 0;

  &-link {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(50% - 8px);
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    background: var(--u-background-2);
    border: 1px solid var(--u-border-1);
    border-radius: 8px;
    color: var(--u-text-1);
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      background: var(--u-background-2);
      border-color: var(--u-border-2);
    }
    &--next {
      text-align: right;
    }
  }
  &-label {
    font-size: 1.2rem;
    color: var(--u-text-3);
  }
  &-title {
    font-size: 1.4rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &-placeholder {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(50% - 8px);
  }
}

.read-view__comments {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--u-border-1);
}

.read-view__comment-login-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 1.25rem;
  color: var(--u-text-4);
}

.read-view__comment-load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.read-view__comment-load-more-btn {
  padding: 8px 20px;
  font-size: 1.2rem;
  color: var(--u-text-2);
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--u-border-2);
    background: var(--u-background-2);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.read-view__catalog {
  flex-shrink: 0;
  width: 200px;
  position: sticky;
  top: 24px;
}
</style>