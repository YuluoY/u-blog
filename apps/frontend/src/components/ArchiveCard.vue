<template>
  <div class="archive-card" :class="[`archive-card--${mode}`]">
    <!-- 方案一：摘要 + 标签行 -->
    <template v-if="mode === CArchiveCardStyle.SUMMARY_TAGS">
      <h3 class="archive-card__title archive-card__title--ellipsis">{{ article.title }}</h3>
      <p v-if="descTrimmed" class="archive-card__desc">{{ descTrimmed }}</p>
      <div class="archive-card__row archive-card__meta">
        <span class="archive-card__date">
          <u-icon icon="fa-solid fa-clock" class="archive-card__icon" aria-hidden="true" />
          {{ dateText }}
        </span>
        <span v-if="categoryOrTags" class="archive-card__tags-inline">
          <u-tag v-if="article.category" size="small" effect="plain" class="archive-card__tag">{{ article.category.name }}</u-tag>
          <u-tag
            v-for="tag in (article.tags ?? []).slice(0, 3)"
            :key="tag.id"
            size="small"
            effect="plain"
            :color="tag.color"
            class="archive-card__tag"
          >
            {{ tag.name }}
          </u-tag>
        </span>
      </div>
      <div class="archive-card__stats">
        <span :aria-label="t('archive.views')"><u-icon icon="fa-solid fa-eye" class="archive-card__icon" />{{ article.viewCount }}</span>
        <span :aria-label="t('archive.likes')"><u-icon icon="fa-solid fa-heart" class="archive-card__icon" />{{ article.likeCount }}</span>
        <span :aria-label="t('archive.comments')"><u-icon icon="fa-solid fa-comment" class="archive-card__icon" />{{ article.commentCount }}</span>
      </div>
    </template>

    <!-- 方案二：封面图 + 右侧信息块 -->
    <template v-else-if="mode === CArchiveCardStyle.COVER_INFO">
      <div class="archive-card__cover-wrap">
        <img v-if="article.cover" :src="article.cover" alt="" class="archive-card__cover" />
        <div v-else class="archive-card__cover-placeholder">
          <u-icon icon="fa-solid fa-file-lines" class="archive-card__cover-icon" />
        </div>
      </div>
      <div class="archive-card__cover-body">
        <h3 class="archive-card__title archive-card__title--2lines">{{ article.title }}</h3>
        <div class="archive-card__meta-line">
          {{ dateText }}
          <template v-if="article.category"> · {{ article.category.name }}</template>
          <span class="archive-card__meta-divider">·</span>
          <u-icon icon="fa-solid fa-eye" class="archive-card__icon" />{{ article.viewCount }}
          <u-icon icon="fa-solid fa-heart" class="archive-card__icon" />{{ article.likeCount }}
          <u-icon icon="fa-solid fa-comment" class="archive-card__icon" />{{ article.commentCount }}
        </div>
        <div v-if="hasTags" class="archive-card__tags-row">
          <u-tag
            v-for="tag in (article.tags ?? []).slice(0, 4)"
            :key="tag.id"
            size="small"
            effect="plain"
            :color="tag.color"
            class="archive-card__tag"
          >
            {{ tag.name }}
          </u-tag>
        </div>
      </div>
    </template>

    <!-- 方案三：极简一行 + 悬停展开（高度过渡动画） -->
    <template v-else-if="mode === CArchiveCardStyle.MINIMAL_EXPAND">
      <u-expandable-row :open="expandOpen" :duration="280">
        <template #summary>
          <span class="archive-card__title archive-card__title--inline">{{ article.title }}</span>
          <span class="archive-card__minimal-sep">|</span>
          <span class="archive-card__minimal-meta">{{ dateText }} · {{ article.viewCount }} / {{ article.likeCount }} / {{ article.commentCount }}</span>
        </template>
        <p v-if="articleDesc" class="archive-card__desc archive-card__desc--one-line">{{ articleDesc }}</p>
        <div v-if="categoryOrTags" class="archive-card__tags-inline">
          <u-tag v-if="article.category" size="small" effect="plain" class="archive-card__tag">{{ article.category.name }}</u-tag>
          <u-tag
            v-for="tag in (article.tags ?? [])"
            :key="tag.id"
            size="small"
            effect="plain"
            :color="tag.color"
            class="archive-card__tag"
          >
            {{ tag.name }}
          </u-tag>
        </div>
      </u-expandable-row>
    </template>

    <!-- 方案四：双行标题 + 统计条 -->
    <template v-else-if="mode === CArchiveCardStyle.STATS_BAR">
      <h3 class="archive-card__title archive-card__title--2lines archive-card__title--large">{{ article.title }}</h3>
      <u-stats-bar
        :segments="statsBarSegments"
        :max="statsBarMax"
      />
      <div class="archive-card__row archive-card__meta">
        <span class="archive-card__date">{{ dateText }}</span>
        <span v-if="article.category" class="archive-card__category">{{ article.category.name }}</span>
        <span v-if="article.isTop" class="archive-card__pinned">{{ t('archive.pinned') }}</span>
      </div>
    </template>

    <!-- 方案五：时间轴强调 + 分类标签主视觉 -->
    <template v-else-if="mode === CArchiveCardStyle.TIMELINE_TAGS">
      <div class="archive-card__tags-top">
        <span v-if="article.isTop" class="archive-card__pinned-badge">{{ t('archive.pinned') }}</span>
        <u-tag v-if="article.category" size="small" effect="plain" class="archive-card__tag archive-card__tag--accent">{{ article.category.name }}</u-tag>
        <u-tag
          v-for="tag in (article.tags ?? []).slice(0, 4)"
          :key="tag.id"
          size="small"
          effect="plain"
          :color="tag.color"
          class="archive-card__tag"
        >
          {{ tag.name }}
        </u-tag>
      </div>
      <h3 class="archive-card__title archive-card__title--ellipsis">{{ article.title }}</h3>
      <div class="archive-card__row archive-card__meta-bottom">
        <span class="archive-card__date archive-card__date--strong">{{ dateText }}</span>
        <span class="archive-card__stats-inline">
          <u-icon icon="fa-solid fa-eye" class="archive-card__icon" />{{ article.viewCount }}
          <u-icon icon="fa-solid fa-heart" class="archive-card__icon" />{{ article.likeCount }}
          <u-icon icon="fa-solid fa-comment" class="archive-card__icon" />{{ article.commentCount }}
        </span>
      </div>
    </template>

    <!-- 方案六：杂志式多列信息 -->
    <template v-else-if="mode === CArchiveCardStyle.MAGAZINE">
      <div class="archive-card__magazine-block archive-card__magazine-head">
        <h3 class="archive-card__title archive-card__title--2lines">{{ article.title }}</h3>
        <p v-if="descTrimmed" class="archive-card__desc archive-card__desc--1line">{{ descTrimmed }}</p>
      </div>
      <div class="archive-card__magazine-block archive-card__magazine-meta">
        <span class="archive-card__meta-item"><u-icon icon="fa-solid fa-clock" class="archive-card__icon" />{{ dateText }}</span>
        <span v-if="article.category" class="archive-card__meta-item"><u-icon icon="fa-solid fa-folder" class="archive-card__icon" />{{ article.category.name }}</span>
        <span v-if="article.isTop" class="archive-card__meta-item"><u-icon icon="fa-solid fa-thumbtack" class="archive-card__icon" />{{ t('archive.pinned') }}</span>
        <span class="archive-card__meta-item"><u-icon icon="fa-solid fa-eye" class="archive-card__icon" />{{ article.viewCount }}</span>
        <span class="archive-card__meta-item"><u-icon icon="fa-solid fa-heart" class="archive-card__icon" />{{ article.likeCount }}</span>
        <span class="archive-card__meta-item"><u-icon icon="fa-solid fa-comment" class="archive-card__icon" />{{ article.commentCount }}</span>
      </div>
      <div v-if="hasTags" class="archive-card__magazine-block archive-card__magazine-tags">
        <u-tag
          v-for="tag in (article.tags ?? [])"
          :key="tag.id"
          size="small"
          effect="plain"
          :color="tag.color"
          class="archive-card__tag"
        >
          {{ tag.name }}
        </u-tag>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '@/utils/date'
import { CArchiveCardStyle } from '@/constants/archive'
import type { IArticle } from '@u-blog/model'
import type { ArchiveCardStyle } from '@/constants/archive'
import { computed, ref, watch, onBeforeUnmount } from 'vue'

const { t } = useI18n()

const EXPAND_DELAY_MS = 300

const props = withDefaults(
  defineProps<{
    article: IArticle
    mode: ArchiveCardStyle
    isHovered?: boolean
    maxStats?: { viewCount: number; likeCount: number; commentCount: number }
  }>(),
  { isHovered: false, maxStats: undefined }
)

const DESC_MAX_LEN = 80

const dateText = computed(() => {
  const d = props.article.publishedAt ?? props.article.createdAt
  return d != null ? formatDateTime(d) : '--'
})

const descTrimmed = computed(() => {
  const d = props.article.desc
  if (!d || typeof d !== 'string') return ''
  return d.length <= DESC_MAX_LEN ? d : d.slice(0, DESC_MAX_LEN) + '…'
})

/** 极简展开内描述用完整文案，单行超出省略由 CSS 控制 */
const articleDesc = computed(() => {
  const d = props.article.desc
  return (d && typeof d === 'string') ? d : ''
})

const categoryOrTags = computed(() => props.article.category || (props.article.tags && props.article.tags.length > 0))
const hasTags = computed(() => (props.article.tags?.length ?? 0) > 0)

const expandOpen = ref(false)
let expandTimer: ReturnType<typeof setTimeout> | null = null
let expandRafId: number | null = null
watch(
  () => props.isHovered,
  (hovered) => {
    if (expandTimer) {
      clearTimeout(expandTimer)
      expandTimer = null
    }
    if (expandRafId != null) {
      cancelAnimationFrame(expandRafId)
      expandRafId = null
    }
    if (hovered) {
      expandTimer = setTimeout(() => {
        expandTimer = null
        // 推迟到下一帧再展开，避免与 hover 样式、sweep 等在同一帧内触发布局，减轻卡顿
        expandRafId = requestAnimationFrame(() => {
          expandRafId = null
          expandOpen.value = true
        })
      }, EXPAND_DELAY_MS)
    } else {
      // 收起也推迟一帧，与父级 hoveredId 更新分离，减少单帧工作量
      expandRafId = requestAnimationFrame(() => {
        expandRafId = null
        expandOpen.value = false
      })
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  if (expandTimer) clearTimeout(expandTimer)
  if (expandRafId != null) cancelAnimationFrame(expandRafId)
})

const statsBarSegments = computed(() => [
  { value: props.article.viewCount, color: 'var(--u-info)', label: t('archive.views') },
  { value: props.article.likeCount, color: 'var(--u-danger)', label: t('archive.likes') },
  { value: props.article.commentCount, color: 'var(--u-success)', label: t('archive.comments') }
])

const statsBarMax = computed(() => {
  const m = props.maxStats
  if (!m) return undefined
  const sum = m.viewCount + m.likeCount + m.commentCount
  return sum || undefined
})
</script>

<style scoped lang="scss">
.archive-card {
  position: relative;
  z-index: 0;
  box-sizing: border-box;
}

.archive-card__title {
  margin: 0;
  font-size: var(--u-font-size-base);
  font-weight: var(--u-font-weight-medium);
  color: var(--u-text-1);
  line-height: 1.4;
  &--ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &--2lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
  }
  &--inline { font-weight: 600; }
  &--large { font-size: var(--u-font-size-lg); }
}

.archive-card__desc {
  margin: 0.25rem 0 0;
  font-size: var(--u-font-size-sm);
  color: var(--u-text-3);
  line-height: 1.45;
  &--1line {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* 严格单行，超出省略 */
  &--one-line {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
}

.archive-card__icon {
  font-size: 0.9em;
  opacity: 0.85;
  margin-right: 0.35rem;
}

.archive-card__meta,
.archive-card__meta-line,
.archive-card__row {
  font-size: var(--u-font-size-sm);
  color: var(--u-text-3);
}

.archive-card__meta-divider {
  margin: 0 0.35rem;
  color: var(--u-text-4);
}

.archive-card__stats,
.archive-card__stats-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--u-font-size-sm);
  color: var(--u-text-3);
}

.archive-card__tag { margin-right: 0.25rem; }
.archive-card__tags-inline { display: flex; flex-wrap: wrap; gap: 0.5rem 0.6rem; align-items: center; }
.archive-card__pinned,
.archive-card__pinned-badge {
  font-size: var(--u-font-size-xs);
  color: var(--u-primary);
}

/* ---------- 方案一 ---------- */
.archive-card--summary_tags {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  .archive-card__desc { margin-top: 0.15rem; }
  .archive-card__meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem 0.8rem; }
  .archive-card__stats { margin-top: 0.35rem; }
}

/* ---------- 方案二 ---------- */
.archive-card--cover_info {
  display: flex;
  align-items: stretch;
  gap: 1.2rem;
}
.archive-card__cover-wrap {
  flex: 0 0 100px;
  width: 100px;
  height: 64px;
  border-radius: var(--u-border-radius-4);
  overflow: hidden;
  background: var(--u-background-4);
}
.archive-card__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.archive-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--u-text-4);
}
.archive-card__cover-icon { font-size: 1.6rem; }
.archive-card__cover-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.archive-card__tags-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

/* ---------- 方案三：极简展开，高度 + 透明度过渡 ---------- */
.archive-card--minimal_expand {
  .archive-card__minimal-sep { color: var(--u-text-4); }
  .archive-card__minimal-meta { color: var(--u-text-3); font-size: var(--u-font-size-sm); }
  :deep(.u-expandable-row__expand .archive-card__desc) { margin-top: 0; }
  :deep(.u-expandable-row__expand .archive-card__desc--one-line) { min-width: 0; }
  :deep(.u-expandable-row__expand .archive-card__tags-inline) { margin-top: 0.5rem; }
}

/* ---------- 方案四 ---------- */
.archive-card--stats_bar {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.archive-card__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.archive-card__category { color: var(--u-text-2); }

/* ---------- 方案五 ---------- */
.archive-card--timeline_tags {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.archive-card__tags-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.archive-card__tag--accent {
  border-color: var(--year-color, var(--u-primary));
  color: var(--year-color, var(--u-primary));
}
.archive-card__meta-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.archive-card__date--strong {
  font-weight: 600;
  color: var(--u-text-2);
}

/* ---------- 方案六 ---------- */
.archive-card--magazine {
  display: grid;
  gap: 0.75rem;
}
.archive-card__magazine-block {
  padding: 0.15rem 0;
}
.archive-card__magazine-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.2rem;
  font-size: var(--u-font-size-sm);
  color: var(--u-text-3);
}
.archive-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.archive-card__magazine-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
</style>
