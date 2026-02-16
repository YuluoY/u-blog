<template>
  <div class="calendar-panel">
    <u-text class="calendar-panel__title">发布记录</u-text>
    <!-- Tab 切换 -->
    <div class="calendar-panel__tabs">
      <button
        type="button"
        class="calendar-panel__tab"
        :class="{ 'is-active': viewMode === 'month' }"
        @click="viewMode = 'month'"
      >
        月历
      </button>
      <button
        type="button"
        class="calendar-panel__tab"
        :class="{ 'is-active': viewMode === 'heatmap' }"
        @click="viewMode = 'heatmap'"
      >
        热力图
      </button>
    </div>

    <!-- 月历视图 -->
    <template v-if="viewMode === 'month'">
      <u-text class="calendar-panel__month">{{ year }}年 {{ month }}月</u-text>
      <div class="calendar-panel__grid" role="grid" aria-label="月历">
        <span v-for="d in dayLabels" :key="d" class="calendar-panel__cell calendar-panel__cell--head">{{ d }}</span>
        <template v-for="(cell, i) in calendarCells" :key="i">
          <button
            v-if="cell"
            type="button"
            class="calendar-panel__cell calendar-panel__cell--day"
            :class="{
              'is-selected': selectedDate === cell.dateStr,
              'has-posts': (dayCountMap[cell.dateStr] ?? 0) > 0
            }"
            :aria-label="`${cell.dateStr}，${dayCountMap[cell.dateStr] ?? 0} 篇`"
            @click="selectDay(cell.dateStr)"
          >
            {{ cell.day }}
            <span v-if="(dayCountMap[cell.dateStr] ?? 0) > 0" class="calendar-panel__dot" />
          </button>
          <span v-else class="calendar-panel__cell" />
        </template>
      </div>
      <!-- 选中日期后展示当日文章 -->
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
        <u-text v-else class="calendar-panel__empty">当日无文章</u-text>
      </div>
    </template>

    <!-- 热力图视图：横向 + 左右滚动 -->
    <template v-else>
      <div class="calendar-panel__heatmap">
        <CalendarHeatmap
          :end-date="heatmapEndDate"
          :values="heatmapValues"
          tooltip-unit="篇"
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
        <u-text v-else class="calendar-panel__empty">当日无文章</u-text>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CalendarHeatmap } from 'vue3-calendar-heatmap'
import 'vue3-calendar-heatmap/dist/style.css'
import { useArticleStore } from '@/stores/model/article'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'CalendarPanel' })

const props = defineProps<{
  onClose?: () => void
}>()

const articleStore = useArticleStore()
const { articleList } = storeToRefs(articleStore)

const viewMode = ref<'month' | 'heatmap'>('month')
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selectedDate = ref<string | null>(null)
const heatmapSelectedDate = ref<string | null>(null)
const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

function formatDate(v: string | Date): string {
  const d = typeof v === 'string' ? new Date(v) : v
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 按日期统计文章数 */
const dayCountMap = computed(() => {
  const map: Record<string, number> = {}
  articleList.value.forEach((a) => {
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
  return articleList.value.filter((a) => formatDate(a.publishedAt ?? a.createdAt) === selectedDate.value)
})

const heatmapEndDate = computed(() => new Date())
const heatmapValues = computed(() => {
  const map: Record<string, number> = {}
  articleList.value.forEach((a) => {
    const d = formatDate(a.publishedAt ?? a.createdAt)
    map[d] = (map[d] ?? 0) + 1
  })
  return Object.entries(map).map(([date, count]) => ({ date, count }))
})
const heatmapLocale = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  days: ['日', '一', '二', '三', '四', '五', '六'],
  on: '', less: '少', more: '多',
}
const heatmapDayArticles = computed(() => {
  if (!heatmapSelectedDate.value) return []
  return articleList.value.filter((a) => formatDate(a.publishedAt ?? a.createdAt) === heatmapSelectedDate.value)
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

  /* Tab 切换 */
  &__tabs {
    display: flex;
    gap: 4px;
    background: var(--u-background-2);
    border-radius: 6px;
    padding: 2px;
  }
  &__tab {
    flex: 1;
    padding: 6px 0;
    font-size: 1.3rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--u-text-2);
    cursor: pointer;
    transition: all 0.15s;
    &.is-active {
      background: var(--u-background-1);
      color: var(--u-text-1);
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
  }

  &__month {
    font-size: 1.3rem;
    color: var(--u-text-2);
    display: block;
  }

  /* 7 列月历网格 */
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    font-size: 1.2rem;
    &--head {
      color: var(--u-text-3);
      font-weight: 500;
      font-size: 1.1rem;
    }
    &--day {
      position: relative;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--u-text-1);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      &:hover {
        background: var(--u-background-3);
      }
      /* 有文章的日期：主题色浅底 + 主题色文字 */
      &.has-posts {
        font-weight: 600;
        color: var(--u-primary-0);
        background: var(--u-primary-light-7);
      }
      /* 选中态：主题色实底 + 白字 */
      &.is-selected {
        background: var(--u-primary-0);
        color: var(--u-white);
      }
    }
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
