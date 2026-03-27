<template>
  <!--
    单条动态卡片
    融合时间线指示器 + 内容 + 操作栏 + 可展开评论区
  -->
  <div class="moment-card" :class="{ 'moment-card--pinned': moment.isPinned }">
    <!-- 时间线指示器 -->
    <div class="moment-card__timeline">
      <div class="moment-card__dot" />
      <div class="moment-card__line" />
    </div>

    <!-- 卡片主体 -->
    <div class="moment-card__body">
      <!-- 头部：头像 + 用户名 + 时间 + 置顶角标 -->
      <header class="moment-card__header">
        <img
          v-if="authorAvatar"
          :src="authorAvatar"
          :alt="authorName"
          class="moment-card__avatar"
        />
        <div class="moment-card__meta">
          <span class="moment-card__author">{{ authorName }}</span>
          <time class="moment-card__time" :datetime="String(moment.createdAt)">
            {{ formattedTime }}
          </time>
        </div>
        <span v-if="moment.isPinned" class="moment-card__pin-badge">
          <u-icon icon="fa-solid fa-thumbtack" />
          {{ t('moments.pinned') }}
        </span>
      </header>

      <!-- 附加信息：心情 / 天气 / 标签 -->
      <div v-if="hasMeta" class="moment-card__extras">
        <span v-if="moment.mood" class="moment-card__mood">{{ moment.mood }}</span>
        <span v-if="moment.weather" class="moment-card__weather">
          <u-icon icon="fa-solid fa-cloud-sun" />
          {{ moment.weather }}
        </span>
        <span v-for="tag in (moment.tags || [])" :key="tag" class="moment-card__tag">
          #{{ tag }}
        </span>
      </div>

      <!-- 正文（Markdown 渲染） -->
      <div class="moment-card__content" v-html="renderedContent" />

      <!-- 图片区 -->
      <MomentImageGrid
        :images="moment.images"
        :layout="moment.imageLayout"
      />

      <!-- 操作栏 -->
      <footer class="moment-card__actions">
        <button
          class="moment-card__action"
          :class="{ 'moment-card__action--active': liked }"
          @click="handleLike"
        >
          <u-icon :icon="liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" />
          <span v-if="displayLikeCount > 0">{{ displayLikeCount }}</span>
        </button>
        <button class="moment-card__action" @click="toggleComments">
          <u-icon icon="fa-regular fa-comment" />
          <span v-if="moment.commentCount > 0">{{ moment.commentCount }}</span>
        </button>
      </footer>

      <!-- 展开式评论区 -->
      <Transition name="slide">
        <div v-if="showComments" class="moment-card__comments">
          <slot name="comments" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IMoment } from '@u-blog/model'
import { formatDistanceToNow } from '@/utils/date'
import { toggleMomentLike, getMomentLikeStatus } from '@/api/moment'
import { useMomentStore } from '@/stores/model/moment'
import MomentImageGrid from './MomentImageGrid.vue'

defineOptions({ name: 'MomentCard' })

const props = defineProps<{
  moment: IMoment
}>()

const emit = defineEmits<{
  /** 评论展开/折叠状态变化 */
  (e: 'toggle-comments', momentId: number, visible: boolean): void
}>()

const { t } = useI18n()
const momentStore = useMomentStore()

/* ---------- 用户信息 ---------- */
const authorName = computed(() =>
  props.moment.user?.namec || props.moment.user?.username || t('common.guest'),
)
const authorAvatar = computed(() => props.moment.user?.avatar || null)

/* ---------- 附加信息（心情/天气/标签） ---------- */
const hasMeta = computed(
  () => props.moment.mood || props.moment.weather || (props.moment.tags?.length ?? 0) > 0,
)

/* ---------- 时间格式化（"5 分钟前"风格） ---------- */
const formattedTime = computed(() => {
  if (!props.moment.createdAt) return ''
  return formatDistanceToNow(props.moment.createdAt)
})

/* ---------- Markdown 渲染（简易 inline） ---------- */
const renderedContent = computed(() => {
  // 简单转换：将 Markdown 换行转为 <br>，保留原始 HTML 安全性由后端保障
  // 实际项目中可替换为 marked / markdown-it 等库
  return props.moment.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
})

/* ---------- 点赞 ---------- */
const liked = ref(false)
const displayLikeCount = ref(props.moment.likeCount ?? 0)

/** 初始化点赞状态 */
getMomentLikeStatus(props.moment.id).then(res => {
  liked.value = res.liked
}).catch(() => {})

async function handleLike() {
  try {
    const result = await toggleMomentLike(props.moment.id)
    liked.value = result.liked
    displayLikeCount.value = result.likeCount
    /* 同步到 store，避免滚动后显示旧数据 */
    momentStore.syncMoment({ id: props.moment.id, likeCount: result.likeCount })
  } catch {
    /* 静默失败 */
  }
}

/* ---------- 评论展开/折叠 ---------- */
const showComments = ref(false)

function toggleComments() {
  showComments.value = !showComments.value
  emit('toggle-comments', props.moment.id, showComments.value)
}
</script>

<style scoped>
.moment-card {
  display: flex;
  gap: 16px;
  position: relative;
}

/* 时间线 */
.moment-card__timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
}

.moment-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--u-primary, #409eff);
  border: 2px solid var(--u-bg, #fff);
  box-shadow: 0 0 0 2px var(--u-primary, #409eff);
  flex-shrink: 0;
  margin-top: 18px;
}

.moment-card--pinned .moment-card__dot {
  background: var(--u-warning, #e6a23c);
  box-shadow: 0 0 0 2px var(--u-warning, #e6a23c);
}

.moment-card__line {
  width: 2px;
  flex: 1;
  background: var(--u-border, #dcdfe6);
  min-height: 20px;
}

/* 卡片主体 */
.moment-card__body {
  flex: 1;
  min-width: 0;
  background: var(--u-card-bg, #fff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.moment-card__body:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 头部 */
.moment-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.moment-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.moment-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.moment-card__author {
  font-weight: 600;
  font-size: 14px;
  color: var(--u-text, #303133);
}

.moment-card__time {
  font-size: 12px;
  color: var(--u-text-secondary, #909399);
}

.moment-card__pin-badge {
  font-size: 12px;
  color: var(--u-warning, #e6a23c);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 附加信息 */
.moment-card__extras {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.moment-card__mood {
  font-size: 18px;
}

.moment-card__weather {
  color: var(--u-text-secondary, #909399);
  display: flex;
  align-items: center;
  gap: 4px;
}

.moment-card__tag {
  color: var(--u-primary, #409eff);
  font-size: 13px;
}

/* 正文 */
.moment-card__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--u-text, #303133);
  word-break: break-word;
}

/* 操作栏 */
.moment-card__actions {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--u-border-light, #ebeef5);
}

.moment-card__action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--u-text-secondary, #909399);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.moment-card__action:hover {
  color: var(--u-primary, #409eff);
  background: var(--u-fill-light, #f5f7fa);
}

.moment-card__action--active {
  color: var(--u-danger, #f56c6c);
}

/* 评论区展开/折叠动画 */
.moment-card__comments {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--u-border-light, #ebeef5);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
