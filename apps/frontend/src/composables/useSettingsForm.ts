import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { UMessageFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useArticleStore } from '@/stores/model/article'
import { CArticleList } from '@/types/const'
import type { ArticleList } from '@/types'
import { getSettings, updateSettings } from '@/api/settings'
import { uploadFile } from '@/api/request'
import { SETTING_KEYS, MASKED_SETTING_KEYS } from '@/constants/settings'
import { encryptForTransport } from '@/utils/transportCrypto'
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
    { value: CArticleList.CARD as ArticleList, label: t('settings.card'), icon: 'fa-solid fa-table-cells-large' },
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
    site_favicon: '',
  })

  const savingModel = ref(false)
  const savingSite = ref(false)
  const uploadingFavicon = ref(false)
  const faviconInputRef = ref<HTMLInputElement | null>(null)
  /** favicon 图片加载失败标记 */
  const faviconLoadError = ref(false)

  // favicon URL 变化时重置加载错误标记
  watch(() => form.site_favicon, () => { faviconLoadError.value = false })

  /** 触发隐藏的文件选择框 */
  function triggerFaviconUpload() {
    faviconInputRef.value?.click()
  }

  /** 处理 favicon 文件选择 → 上传 → 填入 URL */
  async function handleFaviconUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    input.value = ''
    if (file.size > 1024 * 1024) {
      UMessageFn({ message: t('settings.faviconTooLarge'), type: 'warning' })
      return
    }
    uploadingFavicon.value = true
    try {
      const result = await uploadFile(file)
      form.site_favicon = result.url
      UMessageFn({ message: t('settings.faviconUploaded'), type: 'success' })
    } catch (err: any) {
      UMessageFn({ message: err?.message || t('settings.faviconUploadFailed'), type: 'error' })
    } finally {
      uploadingFavicon.value = false
    }
  }

  /** 脱敏字段的显示文本（如 `sk-e***`），用作输入框 placeholder */
  const maskedHints = reactive<Record<string, string>>({})

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
      SETTING_KEYS.SITE_FAVICON,
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
      SETTING_KEYS.SITE_FAVICON,
    ]
    for (const key of formKeys) {
      const item = data[key]
      if (!item) continue
      const val = item.value
      if (MASKED_SETTING_KEYS.has(key)) {
        if (item.masked) {
          // 脱敏字段：表单置空，保存时跳过空值以保留服务端原值
          ;(form as Record<string, string>)[key] = ''
          // 记录脱敏显示值作为 placeholder
          maskedHints[key] = typeof val === 'string' ? val : '***'
        } else if (typeof val === 'string') {
          ;(form as Record<string, string>)[key] = val
        }
      } else {
        ;(form as Record<string, string>)[key] = typeof val === 'string' ? val : String(val ?? '')
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
      // base_url / model：有值则发送，空值跳过以保留服务端原值
      if (form.openai_base_url?.trim()) record[SETTING_KEYS.OPENAI_BASE_URL] = { value: form.openai_base_url.trim() }
      if (form.openai_model?.trim()) record[SETTING_KEYS.OPENAI_MODEL] = { value: form.openai_model.trim() }
      // API Key：非空时加密传输，空值跳过以保留服务端加密存储的原值
      if (form.openai_api_key?.trim()) {
        record[SETTING_KEYS.OPENAI_API_KEY] = { value: await encryptForTransport(form.openai_api_key.trim()) }
      }
      await updateSettings(record)
      await loadServerSettings()
      UMessageFn({ message: t('settings.modelSaved'), type: 'success' })
    } catch (err: any) {
      UMessageFn({ message: err?.message || t('settings.saveFailed'), type: 'error' })
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
        [SETTING_KEYS.SITE_FAVICON]: { value: form.site_favicon },
      })
      // 保存后立即刷新站点标题和图标
      appStore.updateDocumentTitle()
      await loadServerSettings()
      UMessageFn({ message: t('settings.siteSaved'), type: 'success' })
    } catch (err: any) {
      UMessageFn({ message: err?.message || t('settings.saveFailed'), type: 'error' })
    } finally {
      savingSite.value = false
    }
  }

  // 不再在 onMounted 中自动加载设置：
  // 避免 SettingsDrawer 组件挂载时触发重复的 settings + route 请求
  // SettingsDrawer 通过 watch(modelValue) 在抽屉打开时按需加载

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
    uploadingFavicon,
    faviconInputRef,
    faviconLoadError,
    maskedHints,
    loadServerSettings,
    handleListTypeChange,
    handleHomeSortChange,
    saveModelSettings,
    saveSiteSettings,
    triggerFaviconUpload,
    handleFaviconUpload,
    appStore,
  }
}
