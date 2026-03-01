<template>
  <!-- 横幅公告 —— 位于 main 顶部，可关闭，localStorage 记住关闭状态 -->
  <Transition name="banner-slide">
    <div
      v-if="visible && currentAnnouncement"
      class="announcement-banner"
      :style="bannerStyle"
      :class="{ 'announcement-banner--clickable': hasDetail }"
      role="alert"
      @click="handleClick"
    >
      <!-- 公告标题 -->
      <span class="announcement-banner__text">{{ currentAnnouncement.title }}</span>
      <!-- 有详情时显示查看提示 -->
      <span v-if="hasDetail" class="announcement-banner__detail">{{ t('announcement.viewDetail') }}</span>
      <!-- 关闭按钮 -->
      <button
        class="announcement-banner__close"
        @click.stop="dismiss"
        :aria-label="t('announcement.close')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchActiveAnnouncements, type AnnouncementItem } from '@/api/announcement'

const { t } = useI18n()
const router = useRouter()

/** localStorage key，存放已关闭的公告 id 集合 */
const DISMISSED_KEY = 'u-blog:dismissed-announcements'

/** 公告列表 */
const announcements = ref<AnnouncementItem[]>([])
/** 是否已加载完成 */
const loaded = ref(false)
/** 是否显示横幅 */
const visible = ref(true)

/** 读取 localStorage 中已关闭的公告 id */
function getDismissedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as number[])
  } catch {
    return new Set()
  }
}

/** 保存已关闭的公告 id 到 localStorage */
function saveDismissedId(id: number) {
  const ids = getDismissedIds()
  ids.add(id)
  const arr = [...ids].slice(-50)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr))
}

/** 当前展示的公告（第一条未关闭的启用公告） */
const currentAnnouncement = computed<AnnouncementItem | null>(() => {
  if (!loaded.value) return null
  const dismissed = getDismissedIds()
  return announcements.value.find(a => !dismissed.has(a.id)) ?? null
})

/** 是否有详情内容 */
const hasDetail = computed(() => {
  return !!currentAnnouncement.value?.content?.trim()
})

/**
 * 横幅样式变量：bgColor 控制渐变基色，文字色固定跟随主题
 */
const bannerStyle = computed(() => {
  const a = currentAnnouncement.value
  if (!a) return {}
  const base = a.bgColor || 'var(--u-primary)'
  return {
    '--banner-base': base,
  }
})

/** 关闭横幅 */
function dismiss() {
  if (currentAnnouncement.value) {
    saveDismissedId(currentAnnouncement.value.id)
  }
  visible.value = false
  // 延迟后检查是否还有下一条未关闭的公告
  setTimeout(() => {
    visible.value = true
  }, 350)
}

/** 点击横幅 */
function handleClick() {
  if (hasDetail.value && currentAnnouncement.value) {
    router.push(`/announcement/${currentAnnouncement.value.id}`)
  }
}

onMounted(async () => {
  try {
    announcements.value = await fetchActiveAnnouncements()
  } catch {
    // 公告获取失败不影响主流程
  }
  loaded.value = true
})
</script>

<style lang="scss" scoped>
.announcement-banner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 32px 4px 12px;
  /* 通栏无圆角，紧贴 header */
  margin: 0;
  border-radius: 0;
  /* 半透明渐变背景 */
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--banner-base, var(--u-primary)) 12%, transparent) 0%,
    color-mix(in srgb, var(--banner-base, var(--u-primary)) 6%, transparent) 100%
  );
  border-bottom: 1px solid color-mix(in srgb, var(--banner-base, var(--u-primary)) 15%, transparent);
  color: var(--u-text-2);
  font-size: 12px;
  line-height: 1.6;
  overflow: hidden;
  backdrop-filter: blur(6px);
  transition: background 0.2s;
  z-index: 99;

  &--clickable {
    cursor: pointer;

    &:hover {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--banner-base, var(--u-primary)) 18%, transparent) 0%,
        color-mix(in srgb, var(--banner-base, var(--u-primary)) 10%, transparent) 100%
      );
    }
  }

  &__text {
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  &__detail {
    flex-shrink: 0;
    font-size: 11px;
    opacity: 0.6;
    white-space: nowrap;
    transition: opacity 0.2s;

    .announcement-banner--clickable:hover & {
      opacity: 1;
    }
  }

  &__close {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.35;
    transition: opacity 0.2s, background 0.2s;
    padding: 0;

    svg {
      width: 10px;
      height: 10px;
    }

    &:hover {
      opacity: 1;
      background: color-mix(in srgb, var(--banner-base, var(--u-primary)) 12%, transparent);
    }
  }
}

/* 进入/离开动画 */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.25s ease;
}

.banner-slide-enter-from {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.banner-slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .announcement-banner {
    font-size: 11px;
    padding: 3px 28px 3px 10px;
    gap: 6px;
  }
}
</style>
