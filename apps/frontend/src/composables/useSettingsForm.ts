import { reactive, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useArticleStore } from '@/stores/model/article'
import { CArticleList } from '@/types/const'
import type { ArticleList } from '@/types'
import { getSettings, updateSettings } from '@/api/settings'
import { SETTING_KEYS, MASKED_SETTING_KEYS } from '@/constants/settings'
import type { HomeSortType } from '@/api/article'
import { HOME_SORT_DEFAULT } from '@/api/article'

/** 设置表单与加载/保存逻辑，供 SettingsDrawer 等复用 */
export function useSettingsForm() {
  const { t } = useI18n()
  const appStore = useAppStore()
  const articleStore = useArticleStore()
  const { theme, language, visualStyle, articleListType, homeSort } = storeToRefs(appStore)

  const currentListType = ref<ArticleList>(CArticleList.BASE)
  const listTypeOptions = computed(() => [
    { value: CArticleList.BASE as ArticleList, label: t('settings.list'), icon: 'fa-solid fa-list' },
    { value: CArticleList.CARD as ArticleList, label: t('settings.card'), icon: 'fa-solid fa-th-large' },
    { value: CArticleList.WATERFALL as ArticleList, label: t('settings.waterfall'), icon: 'fa-solid fa-water' },
    { value: CArticleList.COMPACT as ArticleList, label: t('settings.compact'), icon: 'fa-solid fa-compress' },
  ])

  const currentHomeSort = ref<HomeSortType>(HOME_SORT_DEFAULT)
  const homeSortOptions = computed(() => [
    { value: 'date' as HomeSortType, label: t('settings.homeSortDate') },
    { value: 'hot' as HomeSortType, label: t('settings.homeSortHot') },
    { value: 'likes' as HomeSortType, label: t('settings.homeSortLikes') },
    { value: 'trending' as HomeSortType, label: t('settings.homeSortTrending') },
  ])

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

  async function loadServerSettings() {
    const keys = [
      SETTING_KEYS.THEME,
      SETTING_KEYS.LANGUAGE,
      SETTING_KEYS.ARTICLE_LIST_TYPE,
      SETTING_KEYS.HOME_SORT,
      SETTING_KEYS.VISUAL_STYLE,
      SETTING_KEYS.OPENAI_API_KEY,
      SETTING_KEYS.OPENAI_BASE_URL,
      SETTING_KEYS.OPENAI_MODEL,
      SETTING_KEYS.SITE_NAME,
      SETTING_KEYS.SITE_DESCRIPTION,
      SETTING_KEYS.SITE_KEYWORDS,
    ]
    const data = await getSettings(keys)
    appStore.hydrateAppearance(data)

    const listTypeVal = data[SETTING_KEYS.ARTICLE_LIST_TYPE]?.value
    if (listTypeVal && typeof listTypeVal === 'string') {
      currentListType.value = listTypeVal as ArticleList
    }
    const homeSortVal = data[SETTING_KEYS.HOME_SORT]?.value
    if (homeSortVal && typeof homeSortVal === 'string' && ['date', 'hot', 'likes', 'trending'].includes(homeSortVal)) {
      currentHomeSort.value = homeSortVal as HomeSortType
    } else {
      currentHomeSort.value = appStore.homeSort ?? HOME_SORT_DEFAULT
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
        if (item.masked) (form as Record<string, string>)[key] = ''
        else if (typeof val === 'string') (form as Record<string, string>)[key] = val
      } else {
        (form as Record<string, string>)[key] = typeof val === 'string' ? val : String(val ?? '')
      }
    }
  }

  async function handleListTypeChange(value: ArticleList) {
    currentListType.value = value
    appStore.setArticleListType(value)
  }

  function handleHomeSortChange(value: HomeSortType) {
    currentHomeSort.value = value
    appStore.setHomeSort(value)
    articleStore.qryArticleList()
  }

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

  return {
    form,
    theme,
    language,
    visualStyle,
    articleListType,
    currentListType,
    listTypeOptions,
    currentHomeSort,
    homeSortOptions,
    savingModel,
    savingSite,
    loadServerSettings,
    handleListTypeChange,
    handleHomeSortChange,
    saveModelSettings,
    saveSiteSettings,
    appStore,
  }
}
