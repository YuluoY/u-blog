<template>
  <div class="setting-page">
    <header class="setting-page__hero">
      <h1 class="setting-page__title">{{ t('settings.title') }}</h1>
      <p class="setting-page__desc">{{ t('settings.desc') }}</p>
    </header>

    <div class="setting-page__content">
      <section class="setting-section">
        <h2 class="setting-section__title">
          <u-icon icon="fa-solid fa-palette" />
          <span>{{ t('settings.appearance') }}</span>
        </h2>
        <p class="setting-section__desc">{{ t('settings.appearanceDesc') }}</p>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.theme') }}</span>
              <span class="setting-item__hint">{{ t('settings.themeHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                :type="theme === 'dark' ? 'primary' : 'info'"
                size="small"
                @click="theme !== 'dark' && appStore.setTheme('dark')"
              >
                <u-icon icon="fa-solid fa-moon" />
                {{ t('settings.dark') }}
              </u-button>
              <u-button
                :type="theme === 'default' ? 'primary' : 'info'"
                size="small"
                @click="theme !== 'default' && appStore.setTheme('default')"
              >
                <u-icon icon="fa-solid fa-sun" />
                {{ t('settings.light') }}
              </u-button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.language') }}</span>
              <span class="setting-item__hint">{{ t('settings.languageHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                :type="language === 'zh' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setLanguage('zh')"
              >
                {{ t('settings.zh') }}
              </u-button>
              <u-button
                :type="language === 'en' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setLanguage('en')"
              >
                {{ t('settings.en') }}
              </u-button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.listStyle') }}</span>
              <span class="setting-item__hint">{{ t('settings.listStyleHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                v-for="opt in listTypeOptions"
                :key="opt.value"
                :type="currentListType === opt.value ? 'primary' : 'info'"
                size="small"
                @click="handleListTypeChange(opt.value)"
              >
                {{ opt.label }}
              </u-button>
            </div>
          </div>
        </div>
      </section>

      <section class="setting-section">
        <h2 class="setting-section__title">
          <u-icon icon="fa-solid fa-robot" />
          <span>{{ t('settings.onlineModel') }}</span>
        </h2>
        <p class="setting-section__desc">{{ t('settings.onlineModelDesc') }}</p>

        <div class="setting-group">
          <div class="setting-form">
            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.openaiKey') }}</label>
              <u-input
                v-model="form.openai_api_key"
                type="password"
                :placeholder="t('settings.openaiKeyPlaceholder')"
                class="setting-form__input"
                show-password
              />
            </div>

            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.openaiBase') }}</label>
              <u-input
                v-model="form.openai_base_url"
                type="text"
                :placeholder="t('settings.openaiBasePlaceholder')"
                class="setting-form__input"
              />
            </div>

            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.modelName') }}</label>
              <u-input
                v-model="form.openai_model"
                type="text"
                :placeholder="t('settings.modelPlaceholder')"
                class="setting-form__input"
              />
            </div>

            <div class="setting-form__actions">
              <u-button type="primary" size="small" :loading="savingModel" @click="saveModelSettings">
                <u-icon icon="fa-solid fa-save" />
                {{ t('settings.saveModel') }}
              </u-button>
            </div>
          </div>
        </div>
      </section>

      <section class="setting-section">
        <h2 class="setting-section__title">
          <u-icon icon="fa-solid fa-globe" />
          <span>{{ t('settings.siteInfo') }}</span>
        </h2>
        <p class="setting-section__desc">{{ t('settings.siteInfoDesc') }}</p>

        <div class="setting-group">
          <div class="setting-form">
            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.siteName') }}</label>
              <u-input
                v-model="form.site_name"
                type="text"
                :placeholder="t('settings.siteNamePlaceholder')"
                class="setting-form__input"
              />
            </div>

            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.siteDesc') }}</label>
              <u-input
                v-model="form.site_description"
                type="text"
                :placeholder="t('settings.siteDescPlaceholder')"
                class="setting-form__input"
              />
            </div>

            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.siteKeywords') }}</label>
              <u-input
                v-model="form.site_keywords"
                type="text"
                :placeholder="t('settings.siteKeywordsPlaceholder')"
                class="setting-form__input"
              />
            </div>

            <div class="setting-form__actions">
              <u-button type="primary" size="small" :loading="savingSite" @click="saveSiteSettings">
                <u-icon icon="fa-solid fa-save" />
                {{ t('settings.saveSite') }}
              </u-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { CArticleList } from '@/types/const'
import type { ArticleList } from '@/types'
import { getSettings, updateSettings } from '@/api/settings'
import { SETTING_KEYS, MASKED_SETTING_KEYS } from '@/constants/settings'

defineOptions({ name: 'SettingView' })

const { t } = useI18n()
const appStore = useAppStore()
const { theme, language, articleListType } = storeToRefs(appStore)

/** 当前选择的列表样式（用于回显） */
const currentListType = ref<ArticleList>(CArticleList.BASE)

const listTypeOptions = computed(() => [
  { value: CArticleList.BASE as ArticleList, label: t('settings.list') },
  { value: CArticleList.CARD as ArticleList, label: t('settings.card') },
  { value: CArticleList.WATERFALL as ArticleList, label: t('settings.waterfall') },
  { value: CArticleList.COMPACT as ArticleList, label: t('settings.compact') },
])

/** 切换文章列表样式并保存到数据库 */
async function handleListTypeChange(value: ArticleList) {
  currentListType.value = value
  appStore.setArticleListType(value)
}

/** 服务端设置表单（仅用于展示与提交，敏感项不预填） */
const form = reactive({
  openai_api_key: '',
  openai_base_url: '',
  openai_model: '',
  site_name: '',
  site_description: '',
  site_keywords: '',
})

const savingModel = ref(false)
const savingSite = ref(false)

/** 从服务端拉取设置并填充表单（含外观：主题、语言、列表样式，会回填到 appStore） */
async function loadServerSettings() {
  const keys = [
    SETTING_KEYS.THEME,
    SETTING_KEYS.LANGUAGE,
    SETTING_KEYS.ARTICLE_LIST_TYPE,
    SETTING_KEYS.OPENAI_API_KEY,
    SETTING_KEYS.OPENAI_BASE_URL,
    SETTING_KEYS.OPENAI_MODEL,
    SETTING_KEYS.SITE_NAME,
    SETTING_KEYS.SITE_DESCRIPTION,
    SETTING_KEYS.SITE_KEYWORDS,
  ]
  const data = await getSettings(keys)
  appStore.hydrateAppearance(data)

  // 回显列表样式
  const listTypeVal = data[SETTING_KEYS.ARTICLE_LIST_TYPE]?.value
  if (listTypeVal && typeof listTypeVal === 'string') {
    currentListType.value = listTypeVal as ArticleList
  }

  const formKeys = [
    SETTING_KEYS.OPENAI_API_KEY,
    SETTING_KEYS.OPENAI_BASE_URL,
    SETTING_KEYS.OPENAI_MODEL,
    SETTING_KEYS.SITE_NAME,
    SETTING_KEYS.SITE_DESCRIPTION,
    SETTING_KEYS.SITE_KEYWORDS,
  ]
  for (const key of formKeys) {
    const item = data[key]
    if (!item) continue
    const val = item.value
    if (MASKED_SETTING_KEYS.has(key)) {
      if (item.masked) form[key as keyof typeof form] = ''
      else if (typeof val === 'string') form[key as keyof typeof form] = val
    } else {
      form[key as keyof typeof form] = typeof val === 'string' ? val : String(val ?? '')
    }
  }
}

/** 提交时敏感项：若前端为空且后端已脱敏，则不传该 key，避免覆盖为空白 */
async function saveModelSettings() {
  savingModel.value = true
  try {
    const record: Record<string, { value: unknown }> = {}
    if (form.openai_base_url !== undefined) record[SETTING_KEYS.OPENAI_BASE_URL] = { value: form.openai_base_url }
    if (form.openai_model !== undefined) record[SETTING_KEYS.OPENAI_MODEL] = { value: form.openai_model }
    if (form.openai_api_key !== undefined && form.openai_api_key.trim()) {
      record[SETTING_KEYS.OPENAI_API_KEY] = { value: form.openai_api_key.trim() }
    }
    await updateSettings(record)
    await loadServerSettings()
  } finally {
    savingModel.value = false
  }
}

async function saveSiteSettings() {
  savingSite.value = true
  try {
    await updateSettings({
      [SETTING_KEYS.SITE_NAME]: { value: form.site_name },
      [SETTING_KEYS.SITE_DESCRIPTION]: { value: form.site_description },
      [SETTING_KEYS.SITE_KEYWORDS]: { value: form.site_keywords },
    })
    await loadServerSettings()
  } finally {
    savingSite.value = false
  }
}

onMounted(() => {
  loadServerSettings()
})
</script>

<style lang="scss" scoped>
.setting-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;

  /* Hero */
  &__hero {
    padding: 32px 0 24px;
    border-bottom: 1px solid var(--u-border-1);
  }

  &__title {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 1.35rem;
    color: var(--u-text-2);
    margin: 6px 0 0;
  }

  /* Content */
  &__content {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
}

/* Section */
.setting-section {
  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    margin: 0 0 8px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--u-primary);

    .u-icon {
      font-size: 1.6rem;
      color: var(--u-primary);
    }
  }

  &__desc {
    font-size: 1.2rem;
    color: var(--u-text-3);
    margin: 0 0 20px;
  }
}

/* Group */
.setting-group {
  background: var(--u-background-2);
  border-radius: 12px;
  border: 1px solid var(--u-border-1);
  overflow: hidden;
}

/* Item */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--u-border-1);
  transition: background 0.2s ease;

  &:hover {
    background: var(--u-background-3);
  }

  &:last-child {
    border-bottom: none;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--u-text-1);
  }

  &__hint {
    font-size: 1.1rem;
    color: var(--u-text-3);
  }

  &__control {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

/* Form */
.setting-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--u-text-1);
  }

  &__input {
    width: 100%;
    max-width: 500px;
  }

  &__actions {
    margin-top: 8px;
  }
}

/* 响应式 */
@media (max-width: 767px) {
  .setting-page {
    gap: 24px;

    &__hero {
      padding: 20px 0 16px;
    }

    &__title {
      font-size: 2rem;
    }

    &__desc {
      font-size: 1.2rem;
    }
  }

  .setting-section {
    &__title {
      font-size: 1.5rem;
    }

    &__desc {
      font-size: 1.1rem;
    }
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;

    &__control {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .setting-form {
    padding: 16px;

    &__input {
      max-width: 100%;
    }
  }
}
</style>
