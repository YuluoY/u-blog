<!--
  CommentItem 单条评论：头像、昵称、时间、内容、回复按钮，支持内联回复与递归子评论。
-->
<template>
  <div
    class="u-comment-item"
    :class="{
      'u-comment-item--replying': isReplying,
      'u-comment-item--nested': isNested,
    }"
    :data-comment-id="comment.id"
  >
    <div class="u-comment-item__inner">
      <!-- 头像 -->
      <div class="u-comment-item__avatar">
        <slot name="avatar">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="u-comment-item__avatar-img"
          />
          <span v-else class="u-comment-item__avatar-fallback">
            {{ displayName.charAt(0).toUpperCase() }}
          </span>
        </slot>
      </div>

      <div class="u-comment-item__main">
        <!-- 头部信息 -->
        <div class="u-comment-item__head">
          <span class="u-comment-item__author">{{ displayName }}</span>
          <!-- 仅「回复的回复」显示 回复@某人，直接回复根评论不显示 -->
          <template v-if="showReplyMention">
            <button
              type="button"
              class="u-comment-item__reply-to"
              @click="onScrollToParent"
            >
              <u-icon icon="fa-solid fa-share" class="u-comment-item__reply-to-icon" />
              回复 @{{ replyTargetName }}
            </button>
          </template>
          <span class="u-comment-item__time">{{ formattedTime }}</span>
        </div>
        <!-- IP 地名 + 设备信息（无数据时显示占位，保证每一条都有该行） -->
        <div class="u-comment-item__meta">
          <u-icon icon="fa-solid fa-location-dot" class="u-comment-item__meta-icon" />
          <span class="u-comment-item__meta-text">{{ locationOrDeviceText }}</span>
        </div>

        <!-- 评论内容：plainContent 为纯文本，否则按 Markdown 渲染并消毒后输出 -->
        <div class="u-comment-item__content">
          <slot name="content">
            <template v-if="plainContent">
              <span class="u-comment-item__text">{{ plainTextWithEmoji }}</span>
            </template>
            <div
              v-else
              class="u-comment-item__text u-comment-item__html"
              v-html="renderedContent"
            />
          </slot>
        </div>

        <!-- 操作按钮 -->
        <div class="u-comment-item__actions">
          <slot name="actions">
            <button
              v-if="loggedIn"
              class="u-comment-item__action-btn"
              :class="{ 'u-comment-item__action-btn--active': isReplying }"
              @click="onToggleReply"
            >
              <u-icon icon="fa-regular fa-comment" />
              <span>{{ isReplying ? '取消回复' : '回复' }}</span>
            </button>
          </slot>
        </div>

        <!-- 内联回复框 -->
        <Transition name="u-comment-reply">
          <div v-if="isReplying" class="u-comment-item__reply-box">
            <u-comment-input
              :model-value="replyContent"
              :placeholder="`回复 ${displayName}...`"
              :max-length="500"
              submit-text="发送"
              :loading="replyLoading"
              compact
              @update:model-value="$emit('update:replyContent', $event)"
              @insert="(t) => $emit('update:replyContent', (replyContent ?? '') + t)"
              @submit="onReplySubmit"
              @cancel="onReplyCancel"
            />
          </div>
        </Transition>

        <!-- 子评论：showChildren 为 false 时由 CommentList 扁平渲染，此处不输出 -->
        <div
          v-if="showChildren && hasChildren"
          class="u-comment-item__children"
          :class="{ 'u-comment-item__children--flat': isNested }"
        >
          <CommentItemSelf
            v-for="child in comment.children"
            :key="child.id"
            :comment="child"
            :plain-content="plainContent"
            :replying-id="replyingId"
            :reply-content="replyContent"
            :reply-loading="replyLoading"
            :logged-in="loggedIn"
            :depth="currentDepth + 1"
            :show-children="showChildren"
            @reply="(c) => emit('reply', c)"
            @reply-submit="(content, c) => emit('reply-submit', content, c)"
            @reply-cancel="emit('reply-cancel')"
            @update:reply-content="(v) => emit('update:replyContent', v)"
            @scroll-to="(id) => emit('scroll-to', id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { emojify } from 'node-emoji'
import type { UCommentItemEmits, UCommentItemProps } from '../types'
import { UIcon } from '@/components/icon'
import UCommentInput from './CommentInput.vue'
import CommentItemSelf from './CommentItem.vue'

defineOptions({
  name: 'UCommentItem'
})

const props = withDefaults(defineProps<UCommentItemProps>(), {
  plainContent: true,
  replyingId: null,
  replyContent: '',
  replyLoading: false,
  loggedIn: false,
  depth: 0,
  showChildren: true
})
const emit = defineEmits<UCommentItemEmits>()

/** 最大嵌套缩进层级 */
const MAX_INDENT_DEPTH = 3
const currentDepth = computed(() => props.depth ?? 0)
const isNested = computed(() => currentDepth.value > 0)

/** 当前条目是否正在被回复 */
const isReplying = computed(() => props.replyingId === props.comment.id)

/** 用户显示名称 */
const displayName = computed(() => {
  const u = props.comment.user
  if (!u) return '匿名'
  return (u as { namec?: string }).namec ?? (u as { username?: string }).username ?? '匿名'
})

/** 头像 URL */
const avatarUrl = computed(() => {
  const u = props.comment.user
  if (!u) return ''
  return (u as { avatar?: string }).avatar ?? ''
})

/** 被回复的父评论 id（用于滚动定位） */
const parentId = computed(() => props.comment.pid ?? props.comment.parent?.id ?? null)

/** 是否为「回复的回复」（父评论也是回复）— 仅此种情况显示「回复 @某人」 */
const showReplyMention = computed(() => {
  if (parentId.value == null) return false
  const parent = props.comment.parent
  return !!(parent && (parent.pid ?? null) != null)
})

/** 纯文本模式下的内容（:shortcode: 已解析为 emoji） */
const plainTextWithEmoji = computed(() => {
  if (!props.comment.content) return ''
  return emojify(String(props.comment.content))
})

/** 评论内容：先解析 :shortcode: → emoji，再按 Markdown 解析并消毒后输出，防止 XSS */
const renderedContent = computed(() => {
  if (props.plainContent || !props.comment.content) return ''
  const raw = String(props.comment.content).trim()
  if (!raw) return ''
  try {
    const withEmoji = emojify(raw)
    const html = marked.parse(withEmoji) as string
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3'] })
  } catch {
    return ''
  }
})

/** 展示：IP 地名、设备信息（浏览器 · 设备）；兼容 camelCase / snake_case，无数据时占位 */
const locationOrDeviceText = computed(() => {
  const c = props.comment as unknown as Record<string, unknown>
  const loc = (c.ipLocation ?? c.ip_location) as string | undefined
  const browser = (c.browser) as string | undefined
  const device = (c.device) as string | undefined
  const locStr = typeof loc === 'string' ? loc.trim() : ''
  const browserStr = typeof browser === 'string' ? browser.trim() : ''
  const deviceStr = typeof device === 'string' ? device.trim() : ''
  const devicePart = browserStr && deviceStr ? `${browserStr} · ${deviceStr}` : browserStr || deviceStr || ''
  const regionPart = locStr || '未知地区'
  const parts = [regionPart, devicePart].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return '未知地区 · 未知设备'
})

/** 被回复的父评论显示名称 */
const replyTargetName = computed(() => {
  if (props.comment.parent?.user) {
    const p = props.comment.parent.user
    return (p as { namec?: string }).namec ?? (p as { username?: string }).username ?? '匿名'
  }
  if (parentId.value == null) return ''
  return '该用户'
})

/** 格式化时间 */
const formattedTime = computed(() => {
  const raw = props.comment.createdAt
  if (!raw) return ''
  const d = typeof raw === 'string' ? new Date(raw) : raw
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  // 1分钟内
  if (diff < 60_000) return '刚刚'
  // 1小时内
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  // 24小时内
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  // 30天内
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return d.toLocaleDateString('zh-CN')
})

const hasChildren = computed(() => {
  const c = props.comment.children
  return Array.isArray(c) && c.length > 0
})

/** 切换回复：已展开则取消，否则开启 */
function onToggleReply() {
  if (isReplying.value) {
    emit('reply-cancel')
  } else {
    emit('reply', props.comment)
  }
}

function onReplySubmit(content: string) {
  emit('reply-submit', content, props.comment)
}

function onReplyCancel() {
  emit('reply-cancel')
}

/** 点击「回复 @某人」时平滑滚动到该评论 */
function onScrollToParent() {
  const id = parentId.value
  if (id != null) emit('scroll-to', id)
}
</script>

<style lang="scss">
@use '../styles/index.scss';
</style>
