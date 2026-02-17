<template>
  <div class="search-panel">
    <u-text class="search-panel__title">{{ t('search.title') }}</u-text>
    <div class="search-panel__input-wrap">
      <u-input v-model="keyword" :placeholder="t('search.placeholder')" clearable size="large" />
    </div>
    <div class="search-panel__result">
      <template v-if="keyword.trim()">
        <template v-if="resultList.length">
          <router-link
            v-for="a in resultList"
            :key="a.id"
            :to="`/read/${a.id}`"
            class="search-panel__link"
            @click="handleClose"
          >
            {{ a.title }}
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
import { useArticleStore } from '@/stores/model/article'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'SearchPanel' })

const { t } = useI18n()

const props = defineProps<{ onClose?: () => void }>()

const keyword = ref('')
const { articleList } = storeToRefs(useArticleStore())

const resultList = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return []
  return articleList.value.filter(a =>
    (a.title ?? '').toLowerCase().includes(k)
  )
})

function handleClose() { props.onClose?.() }
</script>

<style lang="scss" scoped>
.search-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  width: 100%;
  box-sizing: border-box;

  &__title {
    font-weight: 600;
    font-size: 1.8rem;
    color: var(--u-text-1);
    display: block;
    margin-bottom: 4px;
  }

  &__input-wrap {
    width: 100%;
    min-width: 0;
    :deep(.u-input) {
      width: 100%;
      min-width: 0;
    }
  }

  &__result {
    min-height: 100px;
    overflow-y: auto;
    max-height: 45vh;
    padding: 4px 0;
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
  &__empty,
  &__hint {
    font-size: 1.3rem;
    color: var(--u-text-4);
    display: block;
    padding: 12px 0;
    line-height: 1.5;
  }
}
</style>
