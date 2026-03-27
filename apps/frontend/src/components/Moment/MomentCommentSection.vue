<template>
  <!--
    动态卡片内嵌评论区
    复用现有的 UComment / UCommentInput / UCommentList 组件。
    通过 path `/moments/:id` 与评论 store 对接。
  -->
  <div class="moment-comment-section">
    <u-comment>
      <!-- 评论输入：登录 / 游客 -->
      <template v-if="isLoggedIn">
        <u-comment-input
          v-model="commentContent"
          :placeholder="t('moments.commentPlaceholder')"
          :max-length="500"
          :submit-text="t('moments.commentSubmit')"
          :loading="submitting"
          @submit="handleSubmit"
        />
      </template>
      <template v-else>
        <u-comment-input
          v-model="commentContent"
          :placeholder="t('moments.commentPlaceholder')"
          :max-length="500"
          :submit-text="t('moments.commentSubmit')"
          :loading="submitting"
          @submit="handleSubmit"
        >
          <template #prepend>
            <u-input
              v-model="guestNickname"
              size="small"
              prefix-icon="fa-solid fa-user"
              :placeholder="t('moments.guestNickname')"
              :max-length="50"
            />
            <u-input
              v-model="guestEmail"
              size="small"
              prefix-icon="fa-solid fa-envelope"
              :placeholder="t('moments.guestEmail')"
              :max-length="100"
            />
          </template>
        </u-comment-input>
      </template>

      <!-- 评论列表 -->
      <u-comment-list
        :list="(commentList as unknown as UCommentItemData[])"
        :loading="commentLoading"
        :empty-text="t('moments.emptyComments')"
        :plain-content="false"
        :replying-id="replyingId"
        :reply-content="replyContent"
        :reply-loading="replySubmitting"
        :logged-in="true"
        @reply="handleReply"
        @reply-submit="handleReplySubmit"
        @reply-cancel="handleReplyCancel"
        @update:reply-content="replyContent = $event"
      />

      <!-- 加载更多评论 -->
      <div v-if="commentHasMore && !commentLoading && commentList.length > 0" class="moment-comment-section__more">
        <button
          type="button"
          class="moment-comment-section__more-btn"
          :disabled="commentLoading"
          @click="loadMoreComments"
        >
          {{ t('moments.loadMoreComments') }}
        </button>
      </div>
    </u-comment>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CTable } from '@u-blog/model'
import api from '@/api'
import { useCommentStore } from '@/stores/model/comment'
import { useUserStore } from '@/stores/model/user'
import { useMomentStore } from '@/stores/model/moment'
import type { UCommentItemData } from '@u-blog/ui'

defineOptions({ name: 'MomentCommentSection' })

const props = defineProps<{
  momentId: number
}>()

const { t } = useI18n()
const commentStore = useCommentStore()
const userStore = useUserStore()
const momentStore = useMomentStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

/** 评论绑定的 path */
const commentPath = computed(() => `/moments/${props.momentId}`)

/* ---------- 评论状态 ---------- */
const commentList = computed(() => commentStore.getState(commentPath.value).list)
const commentLoading = computed(() => commentStore.getState(commentPath.value).loading)
const commentHasMore = computed(() => commentStore.getState(commentPath.value).hasMore)

/* ---------- 主评论输入 ---------- */
const commentContent = ref('')
const submitting = ref(false)
const guestNickname = ref(localStorage.getItem('guest_nickname') ?? '')
const guestEmail = ref(localStorage.getItem('guest_email') ?? '')

/* ---------- 回复输入 ---------- */
const replyingId = ref<number | null>(null)
const replyContent = ref('')
const replySubmitting = ref(false)

/** 发表主评论 */
async function handleSubmit() {
  const text = commentContent.value?.trim()
  if (!text) return

  if (!isLoggedIn.value && (!guestNickname.value?.trim() || !guestEmail.value?.trim())) return

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      content: text,
      path: commentPath.value,
    }
    if (isLoggedIn.value) {
      payload.userId = userStore.user?.id
    } else {
      payload.nickname = guestNickname.value.trim()
      payload.email = guestEmail.value.trim()
      localStorage.setItem('guest_nickname', payload.nickname as string)
      localStorage.setItem('guest_email', payload.email as string)
    }

    await api(CTable.COMMENT).addComment(payload as any)
    commentContent.value = ''
    await commentStore.qryCommentListByPath(commentPath.value, false)
    /* 同步动态评论数 */
    const m = momentStore.momentList.find(x => x.id === props.momentId)
    if (m) momentStore.syncMoment({ id: props.momentId, commentCount: (m.commentCount ?? 0) + 1 })
  } finally {
    submitting.value = false
  }
}

/** 点击回复 */
function handleReply(comment: UCommentItemData) {
  replyingId.value = comment.id as number
  replyContent.value = ''
}

/** 提交回复 */
async function handleReplySubmit(text: string, comment: UCommentItemData) {
  if (!text.trim()) return
  replySubmitting.value = true
  try {
    const payload: Record<string, unknown> = {
      content: text.trim(),
      path: commentPath.value,
      pid: comment.id,
    }
    if (isLoggedIn.value) {
      payload.userId = userStore.user?.id
    } else {
      payload.nickname = guestNickname.value.trim()
      payload.email = guestEmail.value.trim()
    }

    await api(CTable.COMMENT).addComment(payload as any)
    replyingId.value = null
    replyContent.value = ''
    await commentStore.qryCommentListByPath(commentPath.value, false)
    const m = momentStore.momentList.find(x => x.id === props.momentId)
    if (m) momentStore.syncMoment({ id: props.momentId, commentCount: (m.commentCount ?? 0) + 1 })
  } finally {
    replySubmitting.value = false
  }
}

/** 取消回复 */
function handleReplyCancel() {
  replyingId.value = null
  replyContent.value = ''
}

/** 加载更多评论 */
function loadMoreComments() {
  if (commentHasMore.value && !commentLoading.value)
    commentStore.qryCommentListByPath(commentPath.value, true)
}
</script>

<style scoped>
.moment-comment-section__more {
  text-align: center;
  padding: 8px 0;
}

.moment-comment-section__more-btn {
  padding: 4px 16px;
  font-size: 13px;
  color: var(--u-primary, #409eff);
  background: none;
  border: 1px solid var(--u-border, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.moment-comment-section__more-btn:hover {
  border-color: var(--u-primary, #409eff);
  background: var(--u-primary-light, #ecf5ff);
}

.moment-comment-section__more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
