<template>
  <div class="search-panel">
    <u-text class="search-panel__title">{{ t('search.title') }}</u-text>
    <div class="search-panel__input-row">
      <u-input
        ref="inputRef"
        v-model="keyword"
        :placeholder="t('search.placeholder')"
        clearable
        size="large"
        :aria-label="t('search.title')"
        @keydown.enter.prevent="triggerSearch"
        @blur="triggerSearch"
      />
      <u-button
        type="primary"
        size="default"
        icon="fa-solid fa-magnifying-glass"
        :aria-label="t('search.searchBtn')"
        class="search-panel__btn"
        @click="triggerSearch"
      >
        {{ t('search.searchBtn') }}
      </u-button>
    </div>
    <u-text v-if="keyword.trim()" class="search-panel__hint-inline" tag="p">
      {{ t('search.pressEnter') }}
    </u-text>
    <div class="search-panel__scope-wrap">
      <u-text class="search-panel__scope-label">{{ t('search.scope') }}</u-text>
      <u-select
        v-model="scope"
        :options="scopeOptions"
        :placeholder="t('search.scopeAll')"
        size="default"
        :aria-label="t('search.scope')"
      />
    </div>
    <div class="search-panel__result">
      <template v-if="keyword.trim()">
        <template v-if="loading">
          <div class="search-panel__loading">
            <u-icon icon="fa-solid fa-spinner" spin class="search-panel__loading-icon" />
            <u-text class="search-panel__loading-text">{{ t('search.loading') }}</u-text>
          </div>
        </template>
        <template v-else-if="resultList.length">
          <u-text class="search-panel__result-count" tag="p">
            {{ t('search.resultCount', { n: resultList.length }) }}
          </u-text>
          <router-link
            v-for="a in resultList"
            :key="a.id"
            :to="`/read/${a.id}`"
            class="search-panel__link"
            @click="handleClose"
          >
            <span class="search-panel__title-inner" v-html="highlightKeyword(a.title, keyword.trim())" />
            <p v-if="a.snippet" class="search-panel__snippet" v-html="highlightKeyword(a.snippet, keyword.trim())" />
          </router-link>
        </template>
        <u-text v-else class="search-panel__empty">{{ t('search.empty') }}</u-text>
      </template>
      <u-text v-else class="search-panel__hint">{{ t('search.hint') }}</u-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getArticleSearch } from '@/api/articleSearch'
import type { ArticleSearchItem, SearchScope } from '@/api/articleSearch'

defineOptions({ name: 'SearchPanel' })

const { t } = useI18n()

const props = defineProps<{ onClose?: () => void }>()

const keyword = ref('')
const scope = ref<SearchScope>('all')
const resultList = ref<ArticleSearchItem[]>([])
const loading = ref(false)
const inputRef = ref<{ $el?: HTMLElement } | null>(null)

const scopeOptions = computed(() => [
  { value: 'all', label: t('search.scopeAll') },
  { value: 'title', label: t('search.scopeTitle') },
  { value: 'content', label: t('search.scopeContent') },
  { value: 'desc', label: t('search.scopeDesc') },
])

const DEBOUNCE_MS = 280
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** 执行搜索请求 */
function fetchSearch() {
  const k = keyword.value.trim()
  if (!k) {
    resultList.value = []
    return
  }
  loading.value = true
  getArticleSearch(k, scope.value, 20)
    .then((list) => {
      resultList.value = list
    })
    .catch(() => {
      resultList.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

/** 失焦 / 点击搜索 / Enter 时触发，防抖后发起查询 */
function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    fetchSearch()
  }, DEBOUNCE_MS)
}

/** 关键词清空时只清结果，不发起请求 */
watch(keyword, (val) => {
  if (!val.trim()) {
    resultList.value = []
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    loading.value = false
  }
})

/** 转义正则特殊字符 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 转义 HTML，防止 XSS */
function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return s.replace(/[&<>"']/g, ch => map[ch] ?? ch)
}

/** 在文本中高亮关键词，返回安全 HTML 片段 */
function highlightKeyword(text: string, k: string): string {
  if (!k) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const re = new RegExp(escapeRegExp(k), 'gi')
  return escaped.replace(re, match => `<mark class="search-panel__highlight">${match}</mark>`)
}

function handleClose() {
  props.onClose?.()
}

/** 供父组件在打开面板时聚焦输入框 */
defineExpose({
  focusInput() {
    const root = inputRef.value?.$el
    const input = root?.querySelector?.('input') ?? root
    if (input && typeof (input as HTMLInputElement).focus === 'function') (input as HTMLInputElement).focus()
  },
})
</script>

<style lang="scss" scoped>
.search-panel {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;

  &__title {
    font-weight: 600;
    font-size: 1.8rem;
    color: var(--u-text-1);
    display: block;
    margin-bottom: 4px;
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    :deep(.u-input) {
      flex: 1;
      min-width: 0;
    }
  }

  &__btn {
    flex-shrink: 0;
  }

  /* 提示文案样式：小号、浅灰，与正文区分 */
  &__hint-inline {
    font-size: 0.85rem;
    color: var(--u-text-4);
    line-height: 1.4;
    margin: -2px 0 0;
    opacity: 0.85;
  }

  &__scope-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__scope-label {
    font-size: 1.3rem;
    color: var(--u-text-3);
    flex-shrink: 0;
  }

  &__scope-wrap :deep(.u-select) {
    flex: 1;
    min-width: 0;
  }

  &__result {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 0;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
  }

  &__loading-icon {
    color: var(--u-primary-0);
    flex-shrink: 0;
  }

  &__loading-text {
    font-size: 1.3rem;
    color: var(--u-text-4);
  }

  &__result-count {
    font-size: 1.2rem;
    color: var(--u-text-4);
    margin-bottom: 8px;
  }

  &__link {
    display: block;
    font-size: 1.4rem;
    color: var(--u-text-2);
    padding: 10px 12px;
    text-decoration: none;
    border-radius: 8px;
    margin-bottom: 4px;
    line-height: 1.4;
    transition: background 0.15s, color 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
      color: var(--u-primary-0);
    }
  }

  &__title-inner {
    display: inline;
  }

  &__snippet {
    margin: 6px 0 0;
    font-size: 1.2rem;
    color: var(--u-text-4);
    line-height: 1.45;
    font-weight: normal;
  }

  &__highlight {
    background: var(--u-primary-light-6);
    color: var(--u-primary-0);
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
  }

  /* 空态与底部提示：与正文区分的提示样式 */
  &__empty,
  &__hint {
    font-size: 0.85rem;
    color: var(--u-text-4);
    line-height: 1.45;
    display: block;
    padding: 12px 0;
    opacity: 0.85;
  }
}
</style>
