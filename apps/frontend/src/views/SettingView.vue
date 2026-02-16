<template>
  <u-layout :padding="24">
    <u-region region="center">
      <u-card class="setting-card" shadow="hover">
        <template #header>
          <u-text class="setting-card__title">设置</u-text>
        </template>
        <div class="setting-card__body">
          <div class="setting-item">
            <u-text class="setting-item__label">主题</u-text>
            <div class="setting-item__control">
              <u-button
                :type="appStore.theme === 'dark' ? 'primary' : 'info'"
                size="small"
                @click="appStore.theme !== 'dark' && appStore.setTheme('dark')"
              >
                暗色
              </u-button>
              <u-button
                :type="appStore.theme === 'default' ? 'primary' : 'info'"
                size="small"
                @click="appStore.theme !== 'default' && appStore.setTheme('default')"
              >
                亮色
              </u-button>
            </div>
          </div>
          <div class="setting-item">
            <u-text class="setting-item__label">语言</u-text>
            <div class="setting-item__control">
              <u-button
                :type="appStore.language === 'zh' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setLanguage('zh')"
              >
                中文
              </u-button>
              <u-button
                :type="appStore.language === 'en' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setLanguage('en')"
              >
                English
              </u-button>
            </div>
          </div>
          <div class="setting-item">
            <u-text class="setting-item__label">首页文章列表样式</u-text>
            <div class="setting-item__control">
              <u-button
                v-for="opt in listTypeOptions"
                :key="opt.value"
                :type="appStore.articleListType === opt.value ? 'primary' : 'info'"
                size="small"
                @click="appStore.setArticleListType(opt.value)"
              >
                {{ opt.label }}
              </u-button>
            </div>
          </div>
        </div>
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { CArticleList } from '@/types/const'
import type { ArticleList } from '@/types'

defineOptions({ name: 'SettingView' })

const appStore = useAppStore()

const listTypeOptions: { value: ArticleList; label: string }[] = [
  { value: CArticleList.BASE, label: '列表' },
  { value: CArticleList.CARD, label: '卡片' },
  { value: CArticleList.WATERFALL, label: '瀑布流' },
]
</script>

<style lang="scss" scoped>
.setting-card {
  max-width: 560px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;

  :deep(.u-card__header) {
    padding: 24px 24px 8px;
  }
  :deep(.u-card__body) {
    padding: 24px;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--u-text-1);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--u-border-1);

  &:last-child {
    border-bottom: none;
  }

  &__label {
    font-size: 1.4rem;
    color: var(--u-text-1);
    font-weight: 500;
  }

  &__control {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
