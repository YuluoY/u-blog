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
                <!-- 编辑入口：仅文章作者可见，融入 byline 行尾 -->
                <router-link v-if="canEdit" :to="`/write?edit=${article.id}`" class="read-view__edit-btn" :title="t('read.editArticle')">
                  <u-icon icon="fa-solid fa-pen-to-square" />
                  <span>{{ t('read.editArticle') }}</span>
                </router-link>
              </div>
            </div>
            <dl class="read-view__meta-stats">
              <div class="read-view__meta-stat"><dt>{{ t('read.words') }}</dt><dd>{{ wordCount }}</dd></div>
              <div class="read-view__meta-stat"><dt>{{ t('read.read') }}</dt><dd>~ {{ readingMinutes }} {{ t('read.minutes') }}</dd></div>
              <div v-if="displayViewCount != null" class="read-view__meta-stat"><dt>{{ t('read.viewCount') }}</dt><dd>{{ displayViewCount }}</dd></div>
              <div class="read-view__meta-stat"><dt>{{ t('read.like') }}</dt><dd>{{ displayLikeCount }}</dd></div>
              <div v-if="article.commentCount != null" class="read-view__meta-stat"><dt>{{ t('read.comment') }}</dt><dd>{{ article.commentCount }}</dd></div>
            </dl>
          </header>
          <!-- 密码保护遮罩：文章设置了密码且正文为空时，显示密码输入面板 -->
          <div v-if="isProtectedLocked" class="read-view__protect">
            <div class="read-view__protect-card">
              <u-icon icon="fa-solid fa-lock" class="read-view__protect-icon" />
              <p class="read-view__protect-hint">{{ t('read.protectHint') }}</p>
              <form class="read-view__protect-form" @submit.prevent="handleProtectSubmit">
                <input
                  v-model="protectPassword"
                  type="password"
                  class="read-view__protect-input"
                  :placeholder="t('read.protectPlaceholder')"
                  autocomplete="off"
                />
                <button
                  type="submit"
                  class="read-view__protect-btn"
                  :disabled="protectLoading || !protectPassword.trim()"
                >
                  <span v-if="protectLoading" class="read-view__protect-spinner" />
                  {{ protectLoading ? t('read.protectVerifying') : t('read.protectSubmit') }}
                </button>
              </form>
              <p v-if="protectError" class="read-view__protect-error">{{ protectError }}</p>
            </div>
          </div>
          <!-- 正文渲染 -->
          <component v-if="Preview && articleContent && !isProtectedLocked" :is="Preview" :key="route.params.id" />
          <nav v-if="(prevArticle || nextArticle) && !isProtectedLocked" class="read-view__nav" aria-label="上下篇">
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

          <!-- 点赞按钮（受保护且未解锁时隐藏） -->
          <div v-if="!isProtectedLocked" class="read-view__like-action">
            <button
              type="button"
              class="read-view__like-btn"
              :class="{ 'read-view__like-btn--active': articleLiked }"
              :disabled="likePending"
              @click="handleLikeToggle"
            >
              <u-icon :icon="articleLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" />
              <span>{{ articleLiked ? t('read.liked') : t('read.likeAction') }}</span>
              <span class="read-view__like-count">{{ displayLikeCount }}</span>
            </button>
            <button
              type="button"
              class="read-view__subscribe-btn"
              @click="openSubscribeModal()"
            >
              <u-icon icon="fa-solid fa-bell" />
              <span>{{ t('subscribe.subscribeBtn') }}</span>
            </button>
          </div>

          <!-- 评论区：受保护且未解锁时隐藏 -->
          <section v-if="commentPath && !isProtectedLocked" class="read-view__comments" aria-label="评论区">
            <u-comment :title="t('read.commentSection')" :show-title="true">
              <!-- 登录用户：直接展示评论输入框 -->
              <template v-if="isLoggedIn">
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
              <!-- 游客：昵称 + 邮箱 嵌入 CommentInput 的 prepend 插槽，一体化面板 -->
              <template v-else>
                <u-comment-input
                  v-model="commentContent"
                  :placeholder="t('read.commentPlaceholder')"
                  :max-length="500"
                  :submit-text="t('read.commentSubmit')"
                  :loading="commentSubmitting"
                  :emoji-picker-theme="appStore.theme === CTheme.DARK ? 'dark' : 'light'"
                  @insert="commentContent += $event"
                  @submit="handleCommentSubmit"
                >
                  <template #prepend>
                    <!-- QQ 邮箱自动识别头像 -->
                    <img v-if="guestAvatarUrl" :src="guestAvatarUrl" alt="avatar" class="read-view__qq-avatar" />
                    <u-input
                      v-model="guestNickname"
                      size="small"
                      prefix-icon="fa-solid fa-user"
                      :placeholder="t('read.guestNicknamePlaceholder')"
                      :max-length="50"
                    />
                    <u-input
                      v-model="guestEmail"
                      size="small"
                      prefix-icon="fa-solid fa-envelope"
                      :placeholder="t('read.guestEmailPlaceholder')"
                      :max-length="100"
                    />
                    <span v-if="guestAvatarUrl" class="read-view__qq-badge">QQ</span>
                  </template>
                </u-comment-input>
              </template>
              <u-comment-list
                :list="(commentListByPath as unknown as UCommentItemData[])"
                :loading="commentLoading"
                :empty-text="t('read.emptyComments')"
                :plain-content="false"
                :replying-id="replyingId"
                :reply-content="replyContent"
                :reply-loading="replySubmitting"
                :logged-in="true"
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
import { useBlogOwnerStore } from '@/stores/blogOwner'
import { storeToRefs } from 'pinia'
import { watch, computed, nextTick } from 'vue'
import api from '@/api'
import { recordArticleView, toggleArticleLike, getArticleLikeStatus, fetchQQNickname } from '@/api/request'
import { CTable, CTheme } from '@u-blog/model'
import { UMessageFn } from '@u-blog/ui'
import { getQQAvatarUrl } from '@u-blog/ui'
import type { UCommentItemData } from '@u-blog/ui'
import { filterSensitiveWords } from '@/utils/sensitiveFilter'
import { useSubscribe } from '@/composables/useSubscribe'

defineOptions({
  name: 'ReadView'
})

const { t } = useI18n()
const route = useRoute()
const articleStore = useArticleStore()
const commentStore = useCommentStore()
const userStore = useUserStore()
const appStore = useAppStore()
const blogOwnerStore = useBlogOwnerStore()
const { currentArticle, articleList } = storeToRefs(articleStore)
const { user, isLoggedIn } = storeToRefs(userStore)

const { Preview, Catalog, articleContent, scrollElement } = usePreviewMd({ articleId: route.params.id as string })

const { openSubscribeModal } = useSubscribe()

const article = computed(() => {
  const id = route.params.id as string
  const found = articleStore.findArticleById(id)
  if (found) return found
  const cur = currentArticle.value
  if (cur && (String(cur.id) === id || cur.id === parseInt(id))) return cur
  return null
})

/**
 * 是否可以编辑：已登录 + 是文章作者
 * 分享模式无需检查——游客没有 token 看不到此按钮；
 * 如果博主自己通过分享链接访问且已登录，仍可编辑自己的文章。
 */
const canEdit = computed(() => {
  if (!isLoggedIn.value || !article.value) return false
  const articleUserId = article.value.userId ?? (article.value.user as any)?.id
  return user.value?.id === articleUserId
})

/* ---- 密码保护 ---- */
const protectPassword = ref('')
const protectLoading = ref(false)
const protectError = ref('')
/** 密码已验证后存储正文，用于替换空 content */
const protectUnlockedContent = ref<string | null>(null)

/** 文章是否处于密码保护锁定状态：isProtected=true 且尚未解锁 */
const isProtectedLocked = computed(() => {
  if (!article.value) return false
  // 已解锁：protectUnlockedContent 有值
  if (protectUnlockedContent.value !== null) return false
  // 需要保护：isProtected 且正文为空（后端已剥离）
  return article.value.isProtected === true && !article.value.content?.trim()
})

/** 提交密码验证 */
async function handleProtectSubmit() {
  if (!article.value || !protectPassword.value.trim()) return
  protectLoading.value = true
  protectError.value = ''
  try {
    const result = await api(CTable.ARTICLE).verifyArticleProtect(article.value.id, protectPassword.value.trim())
    if (result && result.content) {
      // 更新 store 中的文章正文
      protectUnlockedContent.value = result.content
      articleStore.setCurrentArticle({ ...article.value, content: result.content })
    } else {
      protectError.value = t('read.protectWrong')
    }
  } catch {
    protectError.value = t('read.protectWrong')
  } finally {
    protectLoading.value = false
  }
}

/** 实时浏览量（由后端返回的最新值覆盖，默认取 article 自带值） */
const liveViewCount = ref<number | null>(null)
const displayViewCount = computed(() => liveViewCount.value ?? article.value?.viewCount ?? null)

/** 点赞状态 */
const articleLiked = ref(false)
const liveLikeCount = ref<number | null>(null)
const likePending = ref(false)
const displayLikeCount = computed(() => liveLikeCount.value ?? article.value?.likeCount ?? 0)

/**
 * 简易浏览器指纹（用于游客点赞去重）
 * 基于 canvas + navigator 特征生成一个简短 hash
 */
function getBrowserFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
    ]
    const str = parts.join('|')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    return Math.abs(hash).toString(36)
  } catch {
    return ''
  }
}

/** 切换点赞 */
async function handleLikeToggle() {
  const id = route.params.id as string
  const articleId = parseInt(id, 10)
  if (!articleId || Number.isNaN(articleId)) return
  likePending.value = true
  try {
    const fp = isLoggedIn.value ? undefined : getBrowserFingerprint()
    const result = await toggleArticleLike(articleId, fp)
    articleLiked.value = result.liked
    liveLikeCount.value = result.likeCount
    // 同步到 Pinia store，首页/归档页数据实时更新
    articleStore.updateArticleLikeCount(articleId, result.likeCount)
  } catch { /* 点赞失败静默 */ }
  finally { likePending.value = false }
}

/** 查询点赞状态 */
async function fetchLikeStatus(articleId: number) {
  try {
    const fp = isLoggedIn.value ? undefined : getBrowserFingerprint()
    const { liked } = await getArticleLikeStatus(articleId, fp)
    articleLiked.value = liked
  } catch { /* 查询失败静默 */ }
}

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

/** 游客信息（存储在 localStorage 以便下次自动填充） */
const guestNickname = ref(localStorage.getItem('guest_nickname') ?? '')
const guestEmail = ref(localStorage.getItem('guest_email') ?? '')

/** 游客 QQ 邮箱头像预览 */
const guestAvatarUrl = computed(() => getQQAvatarUrl(guestEmail.value))

/** QQ 邮箱自动获取真实昵称（当昵称为空或为上次自动填充时覆盖） */
let lastAutoNickname = ''
watch(guestEmail, async (email) => {
  const match = email.match(/^(\d{5,11})@qq\.com$/i)
  if (match) {
    const qq = match[1]
    // 仅在昵称为空或上次自动填充时覆盖
    if (!guestNickname.value.trim() || guestNickname.value === lastAutoNickname) {
      // 先用 QQ 号占位，再异步获取真实昵称
      guestNickname.value = qq
      lastAutoNickname = qq
      const realName = await fetchQQNickname(qq)
      if (realName && (guestNickname.value === qq || guestNickname.value === lastAutoNickname)) {
        guestNickname.value = realName
        lastAutoNickname = realName
      }
    }
  }
})

/** 进入文章页或切换文章时拉取该 path 的评论第一页 */
watch(
  commentPath,
  (path) => {
    if (path) commentStore.qryCommentListByPath(path, false)
  },
  { immediate: true }
)

/** 发表主评论（登录用户 / 游客） */
async function handleCommentSubmit() {
  const text = commentContent.value?.trim()
  if (!text || !commentPath.value) return

  // 游客校验：昵称 + 邮箱必填
  if (!isLoggedIn.value) {
    if (!guestNickname.value?.trim() || !guestEmail.value?.trim()) {
      UMessageFn({ message: t('read.guestFieldsRequired'), type: 'warning' })
      return
    }
  }

  commentSubmitting.value = true
  try {
    const id = route.params.id as string
    const articleId = id ? parseInt(id, 10) : undefined
    // 敏感词过滤
    const filteredText = filterSensitiveWords(text)
    const payload: Parameters<typeof api>[0] extends infer M ? any : never = {
      content: filteredText,
      path: commentPath.value,
      articleId: Number.isNaN(articleId) ? undefined : articleId,
    }
    if (isLoggedIn.value) {
      payload.userId = user.value.id as number
    } else {
      payload.nickname = guestNickname.value.trim()
      payload.email = guestEmail.value.trim()
      // 持久化游客信息
      localStorage.setItem('guest_nickname', payload.nickname)
      localStorage.setItem('guest_email', payload.email)
    }
    await api(CTable.COMMENT).addComment(payload)
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
  } catch (err: any) {
    UMessageFn({ message: err?.message || t('read.commentSubmitFailed'), type: 'error' })
  } finally {
    commentSubmitting.value = false
  }
}

function handleReply(comment: UCommentItemData) {
  replyingId.value = comment.id
  replyContent.value = ''
}

async function handleReplySubmit(text: string, comment: UCommentItemData) {
  if (!text.trim() || !commentPath.value) return
  // 游客校验：昵称 + 邮箱必填
  if (!isLoggedIn.value) {
    if (!guestNickname.value?.trim() || !guestEmail.value?.trim()) {
      UMessageFn({ message: t('read.guestFieldsRequired'), type: 'warning' })
      return
    }
  }
  replySubmitting.value = true
  try {
    // 敏感词过滤
    const filteredText = filterSensitiveWords(text.trim())
    const payload: Record<string, unknown> = {
      content: filteredText,
      path: commentPath.value,
      pid: comment.id,
    }
    if (isLoggedIn.value) {
      payload.userId = user.value.id as number
    } else {
      payload.nickname = guestNickname.value.trim()
      payload.email = guestEmail.value.trim()
      localStorage.setItem('guest_nickname', payload.nickname as string)
      localStorage.setItem('guest_email', payload.email as string)
    }
    await api(CTable.COMMENT).addComment(payload as any)
    replyContent.value = ''
    replyingId.value = null
    await commentStore.qryCommentListByPath(commentPath.value, false)
    if (article.value) {
      articleStore.setCurrentArticle({
        ...article.value,
        commentCount: (article.value.commentCount ?? 0) + 1
      })
    }
  } catch (err: any) {
    UMessageFn({ message: err?.message || t('read.commentSubmitFailed'), type: 'error' })
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

watch(() => route.params.id, async (newId) => {
  // 切换文章时重置浏览量 / 点赞状态 / 密码保护并重新记录
  liveViewCount.value = null
  liveLikeCount.value = null
  articleLiked.value = false
  protectUnlockedContent.value = null
  protectPassword.value = ''
  protectError.value = ''
  if (newId) {
    const articleId = parseInt(newId as string, 10)
    if (articleId && !Number.isNaN(articleId)) {
      try {
        const { viewCount } = await recordArticleView(articleId)
        liveViewCount.value = viewCount
      } catch { /* 统计失败不阻断 */ }
      // 异步查询点赞状态
      fetchLikeStatus(articleId)
    }
  }
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
}

/* 编辑按钮 — 融入 byline 行尾，风格与日期/作者协调 */
.read-view__edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 2px 10px;
  font-size: 1.15rem;
  color: var(--u-text-3);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  cursor: pointer;
  line-height: 1.6;

  .u-icon {
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  &:hover {
    color: var(--u-primary);
    border-color: var(--u-primary);
    background: color-mix(in srgb, var(--u-primary) 8%, transparent);

    .u-icon {
      opacity: 1;
    }
  }
}

.read-view__meta {
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

/* 密码保护面板 */
.read-view__protect {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.read-view__protect-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 360px;
  width: 100%;
  padding: 32px 24px;
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: 12px;
  box-sizing: border-box;
}
.read-view__protect-icon {
  font-size: 2.4rem;
  color: var(--u-text-3);
}
.read-view__protect-hint {
  margin: 0;
  font-size: 1.3rem;
  color: var(--u-text-2);
  text-align: center;
  line-height: 1.6;
}
.read-view__protect-form {
  display: flex;
  gap: 8px;
  width: 100%;
}
.read-view__protect-input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 1.25rem;
  color: var(--u-text-1);
  background: var(--u-background-1);
  border: 1px solid var(--u-border-2);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: var(--u-primary);
  }
}
.read-view__protect-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 1.25rem;
  font-weight: 500;
  color: #fff;
  background: var(--u-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
.read-view__protect-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: protect-spin 0.6s linear infinite;
}
@keyframes protect-spin {
  to { transform: rotate(360deg); }
}
.read-view__protect-error {
  margin: 0;
  font-size: 1.15rem;
  color: #e74c3c;
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

.read-view__like-action {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 24px 0;
  margin-top: 24px;
  border-top: 1px solid var(--u-border-1);
}

.read-view__like-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 1.35rem;
  font-weight: 500;
  color: var(--u-text-2);
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  .u-icon {
    font-size: 1.4rem;
    transition: transform 0.25s ease, color 0.25s ease;
  }

  &:hover:not(:disabled) {
    border-color: #e74c3c;
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.06);

    .u-icon {
      transform: scale(1.15);
    }
  }

  &--active {
    color: #e74c3c;
    border-color: #e74c3c;
    background: rgba(231, 76, 60, 0.08);

    .u-icon {
      color: #e74c3c;
      animation: like-bounce 0.35s ease;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.read-view__like-count {
  font-variant-numeric: tabular-nums;
  min-width: 1.2em;
  text-align: center;
}

.read-view__subscribe-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 1.35rem;
  font-weight: 500;
  color: var(--u-primary-0);
  background: transparent;
  border: 1px solid var(--u-primary-0);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  .u-icon {
    font-size: 1.4rem;
    transition: transform 0.25s ease;
  }

  &:hover {
    background: var(--u-primary-0);
    color: #fff;
    .u-icon { transform: scale(1.1); }
  }
}

@keyframes like-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.read-view__comment-login-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 1.25rem;
  color: var(--u-text-4);
}

/* 游客 QQ 头像 & 标签 */
.read-view__qq-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.read-view__qq-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #fff;
  background: var(--u-primary, #409eff);
  border-radius: 4px;
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

/* 响应式：平板及以下隐藏目录侧栏 */
@media (max-width: 992px) {
  .read-view__catalog {
    display: none;
  }
}

/* 响应式：手机文章详情页适配 */
@media (max-width: 767px) {
  .read-view__body {
    gap: 0;
  }

  /* 头部元信息：缩减间距，排列更紧凑 */
  .read-view__meta {
    padding-bottom: 12px;

    /* 纵向堆叠全居中，与 stats 行对齐 */
    &-top {
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
    }
    &-taxonomy {
      justify-content: center;
      gap: 4px;
    }
    &-category {
      font-size: 1.1rem;
      padding: 2px 8px;
    }
    &-tag {
      font-size: 1.05rem;
      padding: 1px 6px;
    }
    &-byline {
      justify-content: center;
      font-size: 1.1rem;
      gap: 2px 8px;
    }
    &-date {
      font-size: 1.05rem;
    }
    /* 强制 5 个统计项全在同一行，避免孤行 */
    &-stats {
      grid-template-columns: repeat(5, 1fr);
      gap: 6px 0;
    }
    &-stat {
      dt {
        font-size: 0.95rem;
      }
      dd {
        font-size: 1.15rem;
      }
    }
  }

  /* 正文区域：缩小 Markdown 渲染字号 */
  .read-view__content {
    :deep(.md-editor-previewOnly) {
      font-size: 14px;
    }
    :deep(.md-editor-preview) {
      font-size: 14px;

      p, li, td, th, dd, dt {
        font-size: 14px;
        line-height: 1.7;
      }
      h1 { font-size: 22px; }
      h2 { font-size: 19px; }
      h3 { font-size: 17px; }
      h4 { font-size: 15px; }
      blockquote {
        font-size: 13px;
        padding: 8px 12px;
      }
    }
  }

  /* 点赞按钮 */
  .read-view__like-btn {
    font-size: 1.2rem;
    padding: 8px 18px;
    gap: 6px;

    .u-icon {
      font-size: 1.25rem;
    }
  }
  .read-view__like-action {
    padding: 16px 0;
    margin-top: 16px;
  }

  /* 上下篇导航 */
  .read-view__nav {
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;

    &-label {
      font-size: 1.1rem;
    }
    &-title {
      font-size: 1.25rem;
    }
    &-link {
      padding: 8px 12px;
    }
  }

  /* 评论区间距 */
  .read-view__comments {
    margin-top: 20px;
    padding-top: 16px;
  }
  .read-view__comment-login-hint {
    font-size: 1.15rem;
  }
}
</style>