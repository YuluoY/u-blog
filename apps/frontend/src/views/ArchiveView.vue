<template>
  <div class="archive-view">
    <div class="archive-view__center">
      <div v-if="hasFilter" class="archive-view__filters">
        <u-filter-chips
          :label="t('archive.currentFilters')"
          :chips="filterChipsForUi"
          :clear-text="t('archive.clearFilters')"
          @close="onFilterChipClose"
          @clear="clearFilters"
        />
      </div>

      <template v-if="articleStore.archiveLoading">
        <div class="archive-loading">
          <u-icon icon="fa-solid fa-spinner" spin />
          <u-text>{{ t('archive.loading') }}</u-text>
        </div>
      </template>
      <template v-else-if="filteredList.length === 0">
        <div class="archive-empty">
          <u-text>{{ t('archive.noMatches') }}</u-text>
        </div>
      </template>
      <div v-else class="archive-timeline">
        <section
          v-for="group in archiveByYear"
          :key="group.year"
          class="archive-year-group"
        >
          <h2 class="archive-year-title" :style="yearTitleStyle(group.color)">
            {{ group.year }}
            <span class="archive-year-count">{{ t('archive.yearCount', { count: group.articles.length }) }}</span>
          </h2>
          <div
            v-for="(article, idx) in group.articles"
            :key="article.id"
            class="archive-item"
            :class="{ 'archive-item--last': idx === group.articles.length - 1 }"
            @mouseenter="hoveredId = article.id"
            @mouseleave="hoveredId = null"
          >
            <div class="archive-item__track">
              <div
                class="archive-item__line"
                :style="lineStyle(group.color)"
              />
              <div
                class="archive-item__dot-wrap"
                :class="{ 'is-hovered': hoveredId === article.id }"
                :style="dotWrapStyle(group.color)"
              >
                <span class="archive-item__dot-inner" />
              </div>
            </div>
            <div
              class="archive-item__content"
              @click="handleDotClick(String(article.id))"
            >
              <div
                class="archive-item__card"
                :class="{ 'is-hovered': hoveredId === article.id }"
                :style="cardStyle(group.color)"
              >
                <div class="archive-item__sweep" />
                <ArchiveCard
                  :article="article"
                  :mode="appStore.archiveCardStyle"
                  :is-hovered="hoveredId === article.id"
                  :max-stats="archiveMaxStats"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/model/article'
import { useCategoryStore } from '@/stores/model/category'
import { useTagStore } from '@/stores/model/tag'
import { storeToRefs } from 'pinia'
import { formatDateTime } from '@/utils/date'
import { useAppStore } from '@/stores/app'
import ArchiveCard from '@/components/ArchiveCard.vue'
import type { IArticle } from '@u-blog/model'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const appStore = useAppStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const { categoryList } = storeToRefs(categoryStore)
const { tagList } = storeToRefs(tagStore)

defineOptions({
  name: 'ArchiveView'
})

/** UI 主题色变量名，用于按年随机且相邻不重复 */
const THEME_COLOR_VARS = [
  'var(--u-primary)',
  'var(--u-success)',
  'var(--u-warning)',
  'var(--u-danger)',
  'var(--u-info)'
] as const

/** 为年份列表分配颜色，保证相邻年份不同色；确定性分配避免重算时闪烁 */
function assignYearColors(years: number[]): Map<number, string> {
  const map = new Map<number, string>()
  if (years.length === 0) return map
  const n = THEME_COLOR_VARS.length
  let prevIndex = -1
  for (const year of years) {
    const offset = Math.abs(year) % (n - 1) || 1
    let idx = (prevIndex + offset) % n
    if (idx === prevIndex) idx = (prevIndex + 1) % n
    prevIndex = idx
    map.set(year, THEME_COLOR_VARS[idx])
  }
  return map
}

const archiveList = computed(() => articleStore.archiveList)

const queryCategoryIds = computed(() => {
  const raw = route.query.categoryIds
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
})

const queryTagIds = computed(() => {
  const raw = route.query.tagIds
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n))
})

const filterMode = computed(() =>
  route.query.filterMode === 'or' ? 'or' : 'and'
)

const hasFilter = computed(() =>
  queryCategoryIds.value.length > 0 || queryTagIds.value.length > 0
)

interface FilterChipItem {
  key: string
  type: 'category' | 'tag'
  id: number
  name: string
  color?: string
}

const filterChips = computed(() => {
  const cats = queryCategoryIds.value
  const tags = queryTagIds.value
  const list: FilterChipItem[] = []
  categoryList.value
    .filter(c => cats.includes(c.id))
    .forEach(c => list.push({ key: `cat-${c.id}`, type: 'category', id: c.id, name: c.name }))
  tagList.value
    .filter(t => tags.includes(t.id))
    .forEach(t => list.push({ key: `tag-${t.id}`, type: 'tag', id: t.id, name: t.name, color: t.color ?? undefined }))
  return list
})

const filterChipsForUi = computed(() =>
  filterChips.value.map(item => ({
    key: item.key,
    label: item.name,
    tagType: item.type === 'category' ? ('primary' as const) : undefined,
    color: item.color
  }))
)

function onFilterChipClose(chip: { key: string }) {
  const original = filterChips.value.find(c => c.key === chip.key)
  if (original) removeFilter(original)
}

function matchArticle(article: IArticle, categoryIds: number[], tagIds: number[], mode: 'or' | 'and'): boolean {
  const hasCategory = categoryIds.length > 0
  const hasTag = tagIds.length > 0
  const matchCat = !hasCategory || (article.categoryId != null && categoryIds.includes(article.categoryId))
  const tagIdsInArticle = (article.tags ?? []).map(t => t.id)
  const matchTag = !hasTag || tagIds.some(id => tagIdsInArticle.includes(id))
  if (mode === 'or') {
    return (hasCategory && matchCat) || (hasTag && matchTag)
  }
  return matchCat && matchTag
}

const filteredList = computed(() => {
  const list = archiveList.value
  const categoryIds = queryCategoryIds.value
  const tagIds = queryTagIds.value
  const mode = filterMode.value
  if (categoryIds.length === 0 && tagIds.length === 0) return list
  return list.filter(a => matchArticle(a, categoryIds, tagIds, mode))
})

interface YearGroup {
  year: number
  color: string
  articles: IArticle[]
}

const archiveByYear = computed(() => {
  const list = filteredList.value
  const byYear = new Map<number, IArticle[]>()
  for (const a of list) {
    const createdAt = a.createdAt != null ? new Date(a.createdAt) : null
    const year = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getFullYear() : 0
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(a)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a)
  const colorMap = assignYearColors(years)
  return years.map(year => ({
    year,
    color: colorMap.get(year) ?? THEME_COLOR_VARS[0],
    articles: byYear.get(year) ?? []
  }))
})

const hoveredId = ref<number | null>(null)

const archiveMaxStats = computed(() => {
  const list = filteredList.value
  if (list.length === 0) return undefined
  let view = 0
  let like = 0
  let comment = 0
  for (const a of list) {
    if (a.viewCount > view) view = a.viewCount
    if (a.likeCount > like) like = a.likeCount
    if (a.commentCount > comment) comment = a.commentCount
  }
  return { viewCount: view, likeCount: like, commentCount: comment }
})

function yearTitleStyle(color: string) {
  return { '--year-color': color }
}

function lineStyle(color: string) {
  return { '--year-color': color }
}

function dotWrapStyle(color: string) {
  return { '--year-color': color }
}

function cardStyle(color: string) {
  return { '--year-color': color }
}

function removeFilter(item: FilterChipItem) {
  const mode = filterMode.value
  if (item.type === 'category') {
    const next = queryCategoryIds.value.filter(id => id !== item.id)
    const query: Record<string, string> = { filterMode: mode }
    if (next.length) query.categoryIds = next.join(',')
    if (queryTagIds.value.length) query.tagIds = queryTagIds.value.join(',')
    router.replace({ path: '/archive', query })
  } else {
    const next = queryTagIds.value.filter(id => id !== item.id)
    const query: Record<string, string> = { filterMode: mode }
    if (queryCategoryIds.value.length) query.categoryIds = queryCategoryIds.value.join(',')
    if (next.length) query.tagIds = next.join(',')
    router.replace({ path: '/archive', query })
  }
}

function clearFilters() {
  router.replace({ path: '/archive', query: {} })
}

function handleDotClick(id: string) {
  router.push(`/read/${id}`)
}

onMounted(() => {
  articleStore.qryArchiveList()
  categoryStore.qryCategoryList()
  tagStore.qryTagList()
})
</script>

<style scoped lang="scss">
/* 根节点不用 u-layout，避免其 height:100% + overflow:hidden 导致内容被裁切、无滚动条 */
.archive-view {
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
}

.archive-view__center,
.archive-view__filters {
  box-sizing: border-box;
}

.archive-view__filters {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.archive-view__center {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.archive-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--u-text-3);
  font-size: 1.4rem;
}

.archive-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--u-text-3);
}

/* ---------- 按年时间线 ---------- */
.archive-timeline {
  width: 100%;
  min-width: 0;
}

.archive-year-group {
  margin-bottom: 2.4rem;
  &:last-child { margin-bottom: 0; }
}

.archive-year-title {
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--year-color);
  margin: 0 0 1.2rem 2.4rem;
  letter-spacing: 0.04em;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.archive-year-count {
  font-size: var(--u-font-size-sm);
  font-weight: 500;
  color: var(--u-text-3);
  opacity: 0.9;
}

.archive-item {
  display: flex;
  align-items: stretch;
  min-height: 4.8rem;
  position: relative;

  &--last .archive-item__line {
    height: 1.2rem;
  }
}

.archive-item__track {
  position: relative;
  width: 2.4rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 1.2rem;
}

.archive-item__line {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 0.2rem;
  height: 100%;
  min-height: 2.4rem;
  background: var(--year-color);
  opacity: 0.35;
  border-radius: 0.1rem;
  pointer-events: none;
}

.archive-item__dot-wrap {
  position: relative;
  z-index: 1;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: -0.1rem;

  &::before {
    content: '';
    position: absolute;
    inset: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    border: 0.2rem solid var(--year-color);
    opacity: 0.6;
    transition: transform 0.25s var(--u-animation-ease-out), opacity 0.25s ease;
    pointer-events: none;
  }

  &.is-hovered::before {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.85;
  }
}

.archive-item__dot-inner {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: var(--year-color);
  flex-shrink: 0;
  transition: box-shadow 0.2s ease;
}

.archive-item__content {
  flex: 1;
  min-width: 0;
  padding-left: 1.6rem;
  padding-bottom: 1.8rem;
  cursor: pointer;
}

.archive-item__card {
  position: relative;
  overflow: hidden;
  padding: 1.4rem 1.8rem;
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: var(--u-border-radius-6);
  transition: box-shadow 0.25s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: var(--u-shadow-2);
    border-color: var(--u-border-2);
  }
}

.archive-item__sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--year-color) 18%, transparent) 40%,
      color-mix(in srgb, var(--year-color) 8%, transparent) 70%,
      transparent 100%
    );
    transition: none;
  }
}

.archive-item__card.is-hovered .archive-item__sweep::after {
  will-change: transform;
  /* 扫光动画时长 1200ms 结束 */
  animation: archive-sweep 1200ms var(--u-animation-ease-out) forwards;
}

@keyframes archive-sweep {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(350%);
  }
}
</style>
