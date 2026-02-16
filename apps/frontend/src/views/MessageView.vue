<template>
  <div class="message-page">
        <!-- 页面 Hero -->
        <header class="message-page__hero">
          <div class="message-page__hero-content">
            <h1 class="message-page__title">留言板</h1>
            <p class="message-page__desc">分享你的想法，留下你的足迹</p>
          </div>
          <div class="message-page__stats">
            <div class="message-page__stat">
              <span class="message-page__stat-num">{{ list.length }}</span>
              <span class="message-page__stat-label">条留言</span>
            </div>
          </div>
        </header>

        <!-- 发表留言区 -->
        <section class="message-page__editor">
          <template v-if="user?.id">
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
              placeholder="说点什么吧..."
              :max-length="500"
              submit-text="发表留言"
              :loading="submitting"
              :emoji-picker-theme="appStore.theme === CTheme.DARK ? 'dark' : 'light'"
              @insert="content += $event"
              @submit="handleSubmit"
            />
          </template>
          <div v-else class="message-page__login-hint">
            <u-icon icon="fa-regular fa-user" />
            <span>登录后可发表留言</span>
          </div>
        </section>

        <!-- 评论列表 -->
        <section class="message-page__comments">
          <u-comment-list
            :list="list as unknown as UCommentItemData[]"
            :loading="loading"
            empty-text="暂无留言，快来抢沙发吧～"
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
        </section>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/model/user'
import { useAppStore } from '@/stores/app'
import api from '@/api'
import { CTable, CTheme } from '@u-blog/model'
import type { IComment } from '@u-blog/model'
import type { UCommentItemData } from '@u-blog/ui'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()

defineOptions({ name: 'MessageView' })

const MESSAGE_PATH = '/message'

const { user } = storeToRefs(useUserStore())
const content = ref('')
const list = ref<IComment[]>([])
const loading = ref(false)
const submitting = ref(false)

/** 回复状态 */
const replyingId = ref<number | null>(null)
const replyContent = ref('')
const replySubmitting = ref(false)

/** 当前用户显示名 */
const displayCurrentUser = computed(() => {
  const u = user.value as { namec?: string; username?: string } | undefined
  return u?.namec ?? u?.username ?? '用户'
})

/** 获取留言列表，可选保持滚动位置（发表/回复后不跳回顶部） */
async function fetchList(restoreScroll = false) {
  const main = document.querySelector('.layout-base__main')
  const scrollTop = main ? main.scrollTop : 0
  loading.value = true
  try {
    list.value = await api(CTable.COMMENT).getCommentList(MESSAGE_PATH)
  } finally {
    loading.value = false
  }
  if (restoreScroll && main) {
    nextTick(() => {
      main.scrollTop = scrollTop
    })
  }
}

/** 发表主留言 */
async function handleSubmit() {
  const text = content.value?.trim()
  if (!text || !user.value?.id) return
  submitting.value = true
  try {
    await api(CTable.COMMENT).addComment({
      content: text,
      path: MESSAGE_PATH,
      userId: user.value.id as number,
    })
    content.value = ''
    await fetchList(true)
  } finally {
    submitting.value = false
  }
}

/** 点击回复按钮 */
function handleReply(comment: UCommentItemData) {
  replyingId.value = comment.id
  replyContent.value = ''
}

/** 提交回复 */
async function handleReplySubmit(text: string, comment: UCommentItemData) {
  if (!text.trim() || !user.value?.id) return
  replySubmitting.value = true
  try {
    await api(CTable.COMMENT).addComment({
      content: text.trim(),
      path: MESSAGE_PATH,
      userId: user.value.id as number,
      pid: comment.id,
    })
    replyContent.value = ''
    replyingId.value = null
    await fetchList(true)
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

  /* --- 评论区 --- */
  &__comments {
    min-height: 200px;
  }
}
</style>
