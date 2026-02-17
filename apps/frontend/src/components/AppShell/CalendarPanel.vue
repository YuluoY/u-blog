<template>
  <div class="calendar-panel">
    <u-text class="calendar-panel__title">{{ t('calendar.title') }}</u-text>
    <div class="calendar-panel__tabs">
      <u-button
        type="primary"
        size="small"
        :plain="viewMode !== 'month'"
        class="calendar-panel__tab"
        @click="viewMode = 'month'"
      >
        {{ t('calendar.month') }}
      </u-button>
      <u-button
        type="primary"
        size="small"
        :plain="viewMode !== 'heatmap'"
        class="calendar-panel__tab"
        @click="viewMode = 'heatmap'"
      >
        {{ t('calendar.heatmap') }}
      </u-button>
    </div>

    <template v-if="viewMode === 'month'">
      <u-month-picker
        v-model:year="year"
        v-model:month="month"
        :year-options="yearOptions"
        :month-options="monthOptionsForSelect"
        :disable-next="isCurrentMonth"
        size="small"
        :separator="t('calendar.yearMonthSep')"
        :aria-year-label="t('calendar.year')"
        :aria-month-label="t('calendar.month')"
        :prev-month-aria-label="t('calendar.prevMonth')"
        :next-month-aria-label="t('calendar.nextMonth')"
        @prev="prevMonth"
        @next="nextMonth"
      />
      <u-calendar-grid
        :day-labels="dayLabels"
        :cells="calendarCells"
        :selected-date="selectedDate"
        :day-count-map="dayCountMap"
        :aria-label="t('calendar.month')"
        :articles-unit="t('calendar.articles')"
        :on-select-day="selectDay"
      />
      <div v-if="selectedDate" class="calendar-panel__day-list">
        <u-text class="calendar-panel__day-list-title">{{ selectedDate }}</u-text>
        <template v-if="dayArticles.length">
          <router-link
            v-for="a in dayArticles"
            :key="a.id"
            :to="`/read/${a.id}`"
            class="calendar-panel__link"
            @click="handleClose"
          >
            {{ a.title }}
          </router-link>
        </template>
        <u-text v-else class="calendar-panel__empty">{{ t('calendar.noArticle') }}</u-text>
      </div>
    </template>

    <template v-else>
      <div ref="heatmapContainerRef" class="calendar-panel__heatmap">
        <CalendarHeatmap
          :end-date="heatmapEndDate"
          :values="heatmapValues"
          :tooltip-unit="t('calendar.articles')"
          :locale="heatmapLocale"
          :round="2"
          @day-click="onHeatmapDayClick"
        />
      </div>
      <div v-if="heatmapSelectedDate" class="calendar-panel__day-list">
        <u-text class="calendar-panel__day-list-title">{{ heatmapSelectedDate }}</u-text>
        <template v-if="heatmapDayArticles.length">
          <router-link
            v-for="a in heatmapDayArticles"
            :key="a.id"
            :to="`/read/${a.id}`"
            class="calendar-panel__link"
            @click="handleClose"
          >
            {{ a.title }}
          </router-link>
        </template>
        <u-text v-else class="calendar-panel__empty">{{ t('calendar.noArticle') }}</u-text>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarHeatmap } from 'vue3-calendar-heatmap'
import 'vue3-calendar-heatmap/dist/style.css'
import type { IArticle } from '@u-blog/model'
import { useArticleStore } from '@/stores/model/article'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'CalendarPanel' })

const { t } = useI18n()
const props = defineProps<{
  onClose?: () => void
}>()

const articleStore = useArticleStore()
const { articleList } = storeToRefs(articleStore)

const viewMode = ref<'month' | 'heatmap'>('month')
const now = new Date()

/** 从文章列表取最新发布日所在的年月，无文章则用当前年月 */
function getLatestArticleYearMonth(list: { publishedAt?: string | Date; createdAt?: string | Date }[]) {
  if (!list.length) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  let maxTime = 0
  list.forEach((a: { publishedAt?: string | Date; createdAt?: string | Date }) => {
    const t = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime()
    if (t > maxTime) maxTime = t
  })
  const d = new Date(maxTime)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selectedDate = ref<string | null>(null)
const heatmapSelectedDate = ref<string | null>(null)
const heatmapContainerRef = ref<HTMLElement | null>(null)

/** 热力图横向滚动到最右侧，以展示最新日期 */
function scrollHeatmapToEnd() {
  nextTick(() => {
    const run = () => {
      const el = heatmapContainerRef.value
      if (el) {
        el.scrollLeft = el.scrollWidth - el.clientWidth
      }
    }
    requestAnimationFrame(() => {
      run()
      setTimeout(run, 80)
    })
  })
}

watch(viewMode, (mode) => {
  if (mode === 'heatmap') scrollHeatmapToEnd()
})

/** 有文章数据时，将月历默认切到最新发布月份（仅同步一次） */
watch(
  () => articleList.value,
  (list) => {
    if (list.length === 0) return
    const { year: y, month: m } = getLatestArticleYearMonth(list)
    year.value = y
    month.value = m
  },
  { once: true, immediate: true }
)

/** 可选的年份范围：从最早文章年到当前年 */
const yearOptions = computed(() => {
  const years = new Set<number>()
  articleList.value.forEach((a: IArticle) => {
    const d = new Date(a.publishedAt ?? a.createdAt ?? 0)
    if (!Number.isNaN(d.getTime())) years.add(d.getFullYear())
  })
  const min = years.size ? Math.min(...years) : now.getFullYear()
  const max = now.getFullYear()
  const arr: number[] = []
  for (let y = max; y >= min; y--) arr.push(y)
  return arr.length ? arr : [now.getFullYear()]
})

function prevMonth() {
  if (month.value <= 1) {
    year.value -= 1
    month.value = 12
  } else {
    month.value -= 1
  }
}
function nextMonth() {
  if (month.value >= 12) {
    year.value += 1
    month.value = 1
  } else {
    month.value += 1
  }
  if (year.value > now.getFullYear() || (year.value === now.getFullYear() && month.value > now.getMonth() + 1)) {
    year.value = now.getFullYear()
    month.value = now.getMonth() + 1
  }
}

/** 月份下拉选项：当前年只到当前月，往年 1–12 */
const monthOptionsForSelect = computed(() => {
  const maxMonth =
    year.value === now.getFullYear() ? now.getMonth() + 1 : 12
  return Array.from({ length: maxMonth }, (_, i) => ({
    value: i + 1,
    label: t(`calendar.month${i + 1}`)
  }))
})

/** 当选中年变为当前年且当前 month 超出当前月时，修正为当前月 */
watch(
  () => year.value,
  (y) => {
    if (y === now.getFullYear() && month.value > now.getMonth() + 1) {
      month.value = now.getMonth() + 1
    }
  }
)

/** 是否已到当前月（禁用「下一月」） */
const isCurrentMonth = computed(
  () =>
    year.value > now.getFullYear() ||
    (year.value === now.getFullYear() && month.value >= now.getMonth() + 1)
)

const dayLabels = computed(() => [0, 1, 2, 3, 4, 5, 6].map((i) => t(`calendar.day${i}`)))

function formatDate(v: string | Date): string {
  const d = typeof v === 'string' ? new Date(v) : v
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 按日期统计文章数 */
const dayCountMap = computed(() => {
  const map: Record<string, number> = {}
  articleList.value.forEach((a: IArticle) => {
    const d = formatDate(a.publishedAt ?? a.createdAt)
    map[d] = (map[d] ?? 0) + 1
  })
  return map
})

const calendarCells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const last = new Date(year.value, month.value, 0)
  const cells: ({ day: number; dateStr: string } | null)[] = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }
  return cells
})

const dayArticles = computed(() => {
  if (!selectedDate.value) return []
  return articleList.value.filter((a: IArticle) => formatDate(a.publishedAt ?? a.createdAt) === selectedDate.value)
})

/** 热力图仅展示最新月份：结束日为当月最后一天，数据仅含当月 */
const heatmapLatestMonth = computed(() => {
  const { year: y, month: m } = getLatestArticleYearMonth(articleList.value)
  return { year: y, month: m }
})
const heatmapEndDate = computed(() => {
  const { year: y, month: m } = heatmapLatestMonth.value
  return new Date(y, m, 0) // 当月最后一天
})
const heatmapValues = computed(() => {
  const { year: y, month: m } = heatmapLatestMonth.value
  const prefix = `${y}-${String(m).padStart(2, '0')}-`
  const map: Record<string, number> = {}
  articleList.value.forEach((a: IArticle) => {
    const d = formatDate(a.publishedAt ?? a.createdAt)
    if (d.startsWith(prefix)) map[d] = (map[d] ?? 0) + 1
  })
  return Object.entries(map).map(([date, count]) => ({ date, count }))
})
const heatmapLocale = computed(() => ({
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => t(`calendar.month${m}`)),
  days: dayLabels.value,
  on: '', less: t('calendar.heatmapLess'), more: t('calendar.heatmapMore'),
}))
const heatmapDayArticles = computed(() => {
  if (!heatmapSelectedDate.value) return []
  return articleList.value.filter((a: IArticle) => formatDate(a.publishedAt ?? a.createdAt) === heatmapSelectedDate.value)
})

function onHeatmapDayClick(day: { date: Date }) {
  const dateStr = formatDate(day.date)
  heatmapSelectedDate.value = heatmapSelectedDate.value === dateStr ? null : dateStr
}

function selectDay(dateStr: string) {
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

function handleClose() {
  props.onClose?.()
}
</script>

<style lang="scss" scoped>
.calendar-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }

  /* Tab 切换：使用 UButton，保持等分 */
  &__tabs {
    display: flex;
    gap: 4px;
  }
  &__tab {
    flex: 1;
  }

  /* 热力图容器：横向展示，支持左右滚动 */
  &__heatmap {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--u-border-1);
      border-radius: 2px;
    }
    :deep(.vch__container) {
      /* 固定宽度保证格子足够大，超出面板宽度后横向滚动 */
      min-width: 680px;
    }
    :deep(svg.vch__wrapper) {
      width: 100%;
      height: auto;
    }
    :deep(.vch__legend) {
      font-size: 1.1rem;
      color: var(--u-text-3);
    }
  }

  /* 当日文章列表 */
  &__day-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--u-border-1);
  }
  &__day-list-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--u-text-1);
    display: block;
    margin-bottom: 4px;
  }
  &__link {
    display: block;
    font-size: 1.3rem;
    color: var(--u-text-2);
    padding: 6px 8px;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.1s;
    &:hover {
      background: var(--u-background-2);
      color: var(--u-primary-0);
    }
  }
  &__empty {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
    padding: 8px 0;
  }
}
</style>
