<template>
  <div class="message-page">
        <!-- 页面 Hero -->
        <header class="message-page__hero">
          <div class="message-page__hero-content">
            <h1 class="message-page__title">{{ t('message.title') }}</h1>
            <p class="message-page__desc">{{ t('message.desc') }}</p>
          </div>
          <div class="message-page__stats">
            <div class="message-page__stat">
              <span class="message-page__stat-num">{{ list.length }}</span>
              <span class="message-page__stat-label">{{ t('message.count') }}</span>
            </div>
          </div>
        </header>

        <!-- 发表留言区 -->
        <section class="message-page__editor">
          <template v-if="isLoggedIn">
            <div class="message-page__editor-header">
              <div class="message-page__editor-avatar">
                <img
                  v-if="(user as any)?.avatar"
                  :src="(user as any).avatar"
                  :alt="displayCurrentUser"
                  class="message-page__editor-avatar-img"
                />
                <span v-else class="message-page__editor-avatar-fallback">
                  {{ displayCurrentUser.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="message-page__editor-name">{{ displayCurrentUser }}</span>
            </div>
            <u-comment-input
              v-model="content"
              :placeholder="t('message.placeholder')"
              :max-length="500"
              :submit-text="t('message.submit')"
              :loading="submitting"
              :emoji-picker-theme="appStore.theme === CTheme.DARK ? 'dark' : 'light'"
              @insert="content += $event"
              @submit="handleSubmit"
            />
          </template>
          <!-- 游客：昵称 + 邮箱 嵌入 CommentInput 的 prepend 插槽，一体化面板 -->
          <template v-else>
            <u-comment-input
              v-model="content"
              :placeholder="t('message.placeholder')"
              :max-length="500"
              :submit-text="t('message.submit')"
              :loading="submitting"
              :emoji-picker-theme="appStore.theme === CTheme.DARK ? 'dark' : 'light'"
              @insert="content += $event"
              @submit="handleSubmit"
            >
              <template #prepend>
                <!-- QQ 邮箱自动识别头像 -->
                <img v-if="guestAvatarUrl" :src="guestAvatarUrl" alt="avatar" class="message-page__qq-avatar" />
                <u-input
                  v-model="guestNickname"
                  size="small"
                  prefix-icon="fa-solid fa-user"
                  :placeholder="t('message.guestNicknamePlaceholder')"
                  :max-length="50"
                />
                <u-input
                  v-model="guestEmail"
                  size="small"
                  prefix-icon="fa-solid fa-envelope"
                  :placeholder="t('message.guestEmailPlaceholder')"
                  :max-length="100"
                />
                <span v-if="guestAvatarUrl" class="message-page__qq-badge">QQ</span>
              </template>
            </u-comment-input>
          </template>
        </section>

        <!-- 评论列表 -->
        <section class="message-page__comments">
          <u-comment-list
            :list="list as unknown as UCommentItemData[]"
            :loading="loading"
            :empty-text="t('message.empty')"
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
        </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/model/user'
import { useAppStore } from '@/stores/app'
import api from '@/api'
import { fetchQQNickname } from '@/api/request'
import { CTable, CTheme } from '@u-blog/model'
import { UMessageFn } from '@u-blog/ui'
import { getQQAvatarUrl } from '@u-blog/ui'
import type { IComment } from '@u-blog/model'
import type { UCommentItemData } from '@u-blog/ui'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const appStore = useAppStore()

defineOptions({ name: 'MessageView' })

const MESSAGE_PATH = '/message'

const { user, isLoggedIn } = storeToRefs(useUserStore())
const content = ref('')
const list = ref<IComment[]>([])
const loading = ref(false)
const submitting = ref(false)

/** 回复状态 */
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

/** 当前用户显示名 */
const displayCurrentUser = computed(() => {
  const u = user.value as { namec?: string; username?: string } | undefined
  return u?.namec ?? u?.username ?? t('profile.roleUser')
})

/** 获取留言列表，可选保持滚动位置（发表/回复后不跳回顶部） */
async function fetchList(restoreScroll = false) {
  const main = document.querySelector('.layout-base__main')
  const scrollTop = main ? main.scrollTop : 0
  loading.value = true
  try {
    list.value = await api(CTable.COMMENT).getCommentList(MESSAGE_PATH, 1, 200)
  } finally {
    loading.value = false
  }
  if (restoreScroll && main) {
    nextTick(() => {
      main.scrollTop = scrollTop
    })
  }
}

/** 发表主留言（登录用户 / 游客） */
async function handleSubmit() {
  const text = content.value?.trim()
  if (!text) return
  // 游客校验
  if (!isLoggedIn.value) {
    if (!guestNickname.value?.trim() || !guestEmail.value?.trim()) return
  }
  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      content: text,
      path: MESSAGE_PATH,
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
    content.value = ''
    await fetchList(true)
  } catch (err: any) {
    UMessageFn({ message: err?.message || t('message.submitFailed'), type: 'error' })
  } finally {
    submitting.value = false
  }
}

/** 点击回复按钮 */
function handleReply(comment: UCommentItemData) {
  replyingId.value = comment.id
  replyContent.value = ''
}

/** 提交回复（登录用户 / 游客） */
async function handleReplySubmit(text: string, comment: UCommentItemData) {
  if (!text.trim()) return
  // 游客校验
  if (!isLoggedIn.value) {
    if (!guestNickname.value?.trim() || !guestEmail.value?.trim()) return
  }
  replySubmitting.value = true
  try {
    const payload: Record<string, unknown> = {
      content: text.trim(),
      path: MESSAGE_PATH,
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
    await fetchList(true)
  } catch (err: any) {
    UMessageFn({ message: err?.message || t('message.submitFailed'), type: 'error' })
  } finally {
    replySubmitting.value = false
  }
}

/** 取消回复 */
function handleReplyCancel() {
  replyingId.value = null
  replyContent.value = ''
}

/** 平滑滚动到指定评论（点击「回复 @某人」时调用） */
function scrollToComment(commentId: number) {
  nextTick(() => {
    const el = document.querySelector(`[data-comment-id="${commentId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.message-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;

  /* --- Hero --- */
  &__hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 32px 0 24px;
    border-bottom: 1px solid var(--u-border-1);
    gap: 16px;
  }

  &__title {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 1.35rem;
    color: var(--u-text-4);
    margin: 6px 0 0;
  }

  &__stats {
    flex-shrink: 0;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__stat-num {
    font-size: 2rem;
    font-weight: 700;
    color: var(--u-primary);
    line-height: 1;
  }

  &__stat-label {
    font-size: 1.2rem;
    color: var(--u-text-4);
  }

  /* --- 编辑区 --- */
  &__editor {
    background: var(--u-background-2);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--u-border-1);
  }

  &__editor-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  &__editor-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-shrink: 0;
  }

  &__editor-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__editor-avatar-fallback {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
  }

  &__editor-name {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--u-text-1);
  }

  &__login-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    font-size: 1.3rem;
    color: var(--u-text-4);

    .u-icon {
      font-size: 1.4rem;
    }
  }

  /* 游客 QQ 头像 & 标签 */
  &__qq-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__qq-badge {
    flex-shrink: 0;
    padding: 1px 6px;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    color: #fff;
    background: var(--u-primary, #409eff);
    border-radius: 4px;
  }

  /* --- 评论区 --- */
  &__comments {
    min-height: 200px;
  }
}
</style>
