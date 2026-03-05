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

          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.homeSort') }}</span>
              <span class="setting-item__hint">{{ t('settings.homeSortHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                v-for="opt in homeSortOptions"
                :key="opt.value"
                :type="currentHomeSort === opt.value ? 'primary' : 'info'"
                size="small"
                @click="handleHomeSortChange(opt.value)"
              >
                {{ opt.label }}
              </u-button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.visualStyle') }}</span>
              <span class="setting-item__hint">{{ t('settings.visualStyleHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                :type="visualStyle === 'default' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setVisualStyle('default')"
              >
                <u-icon icon="fa-solid fa-square" />
                {{ t('settings.visualDefault') }}
              </u-button>
              <u-button
                :type="visualStyle === 'glass' ? 'primary' : 'info'"
                size="small"
                @click="appStore.setVisualStyle('glass')"
              >
                <u-icon icon="fa-solid fa-glass-water" />
                {{ t('settings.visualGlass') }}
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
        <p class="setting-section__local-hint">
          <u-icon icon="fa-solid fa-circle-info" />
          {{ t('settings.modelLocalHint') }}
        </p>

        <div class="setting-group">
          <div class="setting-form">
            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.openaiKey') }}</label>
              <u-input
                v-model="form.openai_api_key"
                type="password"
                :placeholder="maskedHints.openai_api_key || t('settings.openaiKeyPlaceholder')"
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

            <!-- 温度滑块 -->
            <div class="setting-form__item">
              <label class="setting-form__label">
                {{ t('settings.temperature') }}
                <span class="setting-form__value">{{ form.openai_temperature.toFixed(1) }}</span>
              </label>
              <span class="setting-form__hint">{{ t('settings.temperatureHint') }}</span>
              <u-slider
                v-model="form.openai_temperature"
                :min="0"
                :max="2"
                :step="0.1"
                show-input
                class="setting-form__slider"
              />
            </div>

            <!-- 最大输出长度 -->
            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.maxTokens') }}</label>
              <span class="setting-form__hint">{{ t('settings.maxTokensHint') }}</span>
              <u-input
                v-model.number="form.openai_max_tokens"
                type="number"
                :placeholder="t('settings.maxTokensPlaceholder')"
                class="setting-form__input"
              />
            </div>

            <!-- 上下文消息数滑块 -->
            <div class="setting-form__item">
              <label class="setting-form__label">
                {{ t('settings.contextLength') }}
                <span class="setting-form__value">{{ form.openai_context_length }}</span>
              </label>
              <span class="setting-form__hint">{{ t('settings.contextLengthHint') }}</span>
              <u-slider
                v-model="form.openai_context_length"
                :min="1"
                :max="50"
                :step="1"
                show-input
                class="setting-form__slider"
              />
            </div>

            <!-- 系统提示词 -->
            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.systemPrompt') }}</label>
              <span class="setting-form__hint">{{ t('settings.systemPromptHint') }}</span>
              <textarea
                v-model="form.openai_system_prompt"
                class="setting-form__textarea"
                :placeholder="t('settings.systemPromptPlaceholder')"
                rows="4"
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

            <div class="setting-form__item">
              <label class="setting-form__label">{{ t('settings.siteFavicon') }}</label>
              <div class="setting-form__favicon-row">
                <div class="setting-form__favicon-preview-wrap">
                  <img
                    v-if="form.site_favicon && !faviconLoadError"
                    :src="faviconDisplayUrl"
                    class="setting-form__favicon-preview"
                    @error="faviconLoadError = true"
                  />
                  <div v-else class="setting-form__favicon-empty">
                    <u-icon icon="fa-solid fa-image" />
                  </div>
                </div>
                <div class="setting-form__favicon-controls">
                  <u-input
                    v-model="form.site_favicon"
                    type="text"
                    :placeholder="t('settings.siteFaviconPlaceholder')"
                    class="setting-form__input"
                  />
                  <div class="setting-form__favicon-btns">
                    <u-button size="small" :loading="uploadingFavicon" @click="triggerFaviconUpload">
                      <u-icon icon="fa-solid fa-upload" />
                      {{ t('settings.uploadFavicon') }}
                    </u-button>
                    <input
                      ref="faviconInputRef"
                      type="file"
                      accept=".ico,.png,.svg,.jpg,.jpeg,.webp,image/*"
                      style="display: none"
                      @change="handleFaviconUpload"
                    />
                  </div>
                </div>
              </div>
              <p class="setting-form__hint">{{ t('settings.siteFaviconHint') }}</p>
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

      <!-- 博客偏好设置（需登录） -->
      <section v-if="isLoggedIn" class="setting-section">
        <h2 class="setting-section__title">
          <u-icon icon="fa-solid fa-blog" />
          <span>{{ t('settings.blogPreferences') }}</span>
        </h2>
        <p class="setting-section__desc">{{ t('settings.blogPreferencesDesc') }}</p>

        <div class="setting-group">
          <!-- 仅看自己文章 -->
          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.onlyOwnArticles') }}</span>
              <span class="setting-item__hint">{{ t('settings.onlyOwnArticlesHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                :type="blogForm.only_own_articles ? 'primary' : 'info'"
                size="small"
                @click="blogForm.only_own_articles = !blogForm.only_own_articles"
              >
                {{ blogForm.only_own_articles ? t('common.confirm') : t('common.close') }}
              </u-button>
            </div>
          </div>

          <!-- 友链申请通知 -->
          <div class="setting-item">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.friendLinkNotify') }}</span>
              <span class="setting-item__hint">{{ t('settings.friendLinkNotifyHint') }}</span>
            </div>
            <div class="setting-item__control">
              <u-button
                :type="blogForm.friend_link_notify ? 'primary' : 'info'"
                size="small"
                @click="blogForm.friend_link_notify = !blogForm.friend_link_notify"
              >
                {{ blogForm.friend_link_notify ? t('common.confirm') : t('common.close') }}
              </u-button>
            </div>
          </div>

          <!-- 路由可见性 -->
          <div class="setting-item setting-item--column">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.visibleRoutes') }}</span>
              <span class="setting-item__hint">{{ t('settings.visibleRoutesHint') }}</span>
            </div>
            <div class="setting-item__control setting-item__control--wrap">
              <u-button
                v-for="routeOpt in routeOptions"
                :key="routeOpt.value"
                :type="blogForm.visible_routes.includes(routeOpt.value) ? 'primary' : 'info'"
                size="small"
                @click="toggleVisibleRoute(routeOpt.value)"
              >
                {{ routeOpt.label }}
              </u-button>
            </div>
          </div>

          <!-- 分享模式 -->
          <div class="setting-item setting-item--column">
            <div class="setting-item__info">
              <span class="setting-item__label">{{ t('settings.shareMode') }}</span>
              <span class="setting-item__hint">{{ t('settings.shareModeHint') }}</span>
            </div>
            <div class="setting-item__control setting-item__control--wrap">
              <u-button
                :type="blogForm.share_mode === 'readonly' ? 'primary' : 'info'"
                size="small"
                @click="blogForm.share_mode = 'readonly'"
              >
                {{ t('settings.shareModeReadonly') }}
              </u-button>
              <u-button
                :type="blogForm.share_mode === 'full' ? 'primary' : 'info'"
                size="small"
                @click="blogForm.share_mode = 'full'"
              >
                {{ t('settings.shareModeFull') }}
              </u-button>
            </div>
            <p class="setting-item__desc-text">
              {{ blogForm.share_mode === 'full' ? t('settings.shareModeFullDesc') : t('settings.shareModeReadonlyDesc') }}
            </p>
          </div>

          <div class="setting-form__actions">
            <u-button type="primary" size="small" :loading="savingBlog" @click="saveBlogSettings">
              <u-icon icon="fa-solid fa-save" />
              {{ t('settings.saveBlog') }}
            </u-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { UMessageFn } from '@u-blog/ui'
import { useAppStore } from '@/stores/app'
import { useArticleStore } from '@/stores/model/article'
import { useUserStore } from '@/stores/model/user'
import { CArticleList } from '@/types/const'
import type { ArticleList } from '@/types'
import { CVisualStyle } from '@u-blog/model'
import type { VisualStyle } from '@u-blog/model'
import { getSettings, updateSettings } from '@/api/settings'
import { uploadFile } from '@/api/request'
import { SETTING_KEYS, MASKED_SETTING_KEYS } from '@/constants/settings'
import { encryptForTransport } from '@/utils/transportCrypto'
import type { HomeSortType } from '@/api/article'
import { HOME_SORT_DEFAULT } from '@/api/article'

defineOptions({ name: 'SettingView' })

const { t } = useI18n()
const appStore = useAppStore()
const articleStore = useArticleStore()
const userStore = useUserStore()
const { theme, language, visualStyle, articleListType, homeSort } = storeToRefs(appStore)

/** 当前选择的列表样式（用于回显） */
const currentListType = ref<ArticleList>(CArticleList.BASE)

const listTypeOptions = computed(() => [
  { value: CArticleList.BASE as ArticleList, label: t('settings.list') },
  { value: CArticleList.CARD as ArticleList, label: t('settings.card') },
  { value: CArticleList.WATERFALL as ArticleList, label: t('settings.waterfall') },
  { value: CArticleList.COMPACT as ArticleList, label: t('settings.compact') },
])

/** 切换文章列表样式并保存到数据库 */
async function handleListTypeChange(value: ArticleList)
{
  currentListType.value = value
  appStore.setArticleListType(value)
}

/** 当前首页排序（用于回显） */
const currentHomeSort = ref<HomeSortType>(HOME_SORT_DEFAULT)

const homeSortOptions = computed(() => [
  { value: 'date' as HomeSortType, label: t('settings.homeSortDate') },
  { value: 'hot' as HomeSortType, label: t('settings.homeSortHot') },
  { value: 'likes' as HomeSortType, label: t('settings.homeSortLikes') },
  { value: 'trending' as HomeSortType, label: t('settings.homeSortTrending') },
])

/** 切换首页文章排序并刷新列表 */
function handleHomeSortChange(value: HomeSortType)
{
  currentHomeSort.value = value
  appStore.setHomeSort(value)
  articleStore.qryArticleList()
}

/** 服务端设置表单 */
const form = reactive({
  openai_api_key: '',
  openai_base_url: '',
  openai_model: '',
  openai_temperature: 0.7,
  openai_max_tokens: 2048,
  openai_system_prompt: '',
  openai_context_length: 20,
  site_name: '',
  site_description: '',
  site_keywords: '',
  site_favicon: '',
})

const savingModel = ref(false)
const savingSite = ref(false)
const savingBlog = ref(false)
const uploadingFavicon = ref(false)
const faviconInputRef = ref<HTMLInputElement | null>(null)
/** favicon 图片加载失败标记（URL 无效时 fallback 为空状态图标） */
const faviconLoadError = ref(false)

/** favicon 展示 URL（相对路径直接使用，/uploads 有独立的 Vite 代理规则） */
const faviconDisplayUrl = computed(() =>
{
  const val = form.site_favicon
  if (!val) return ''
  return val
})

// favicon URL 变化时重置加载错误标记
watch(() => form.site_favicon, () =>
{
  faviconLoadError.value = false
})

/** 触发隐藏的文件选择框 */
function triggerFaviconUpload()
{
  faviconInputRef.value?.click()
}

/** 处理 favicon 文件选择 → 上传 → 填入 URL */
async function handleFaviconUpload(e: Event)
{
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  // 重置 input 以允许重复选择同一文件
  input.value = ''
  // 校验大小（1MB 限制，favicon 通常很小）
  if (file.size > 1024 * 1024)
  {
    UMessageFn({ message: t('settings.faviconTooLarge'), type: 'warning' })
    return
  }
  uploadingFavicon.value = true
  try
  {
    const result = await uploadFile(file)
    form.site_favicon = result.url
    UMessageFn({ message: t('settings.faviconUploaded'), type: 'success' })
  }
  catch (err: any)
  {
    UMessageFn({ message: err?.message || t('settings.faviconUploadFailed'), type: 'error' })
  }
  finally
  {
    uploadingFavicon.value = false
  }
}

/** 脱敏字段的显示文本（如 `sk-e***`），用作输入框 placeholder */
const maskedHints = reactive<Record<string, string>>({})

/** 从服务端拉取设置并填充表单（含外观：主题、语言、列表样式，会回填到 appStore） */
async function loadServerSettings()
{
  const keys = [
    SETTING_KEYS.THEME,
    SETTING_KEYS.LANGUAGE,
    SETTING_KEYS.ARTICLE_LIST_TYPE,
    SETTING_KEYS.HOME_SORT,
    SETTING_KEYS.VISUAL_STYLE,
    SETTING_KEYS.OPENAI_API_KEY,
    SETTING_KEYS.OPENAI_BASE_URL,
    SETTING_KEYS.OPENAI_MODEL,
    SETTING_KEYS.OPENAI_TEMPERATURE,
    SETTING_KEYS.OPENAI_MAX_TOKENS,
    SETTING_KEYS.OPENAI_SYSTEM_PROMPT,
    SETTING_KEYS.OPENAI_CONTEXT_LENGTH,
    SETTING_KEYS.SITE_NAME,
    SETTING_KEYS.SITE_DESCRIPTION,
    SETTING_KEYS.SITE_KEYWORDS,
    SETTING_KEYS.SITE_FAVICON,
    SETTING_KEYS.ONLY_OWN_ARTICLES,
    SETTING_KEYS.FRIEND_LINK_NOTIFY,
    SETTING_KEYS.VISIBLE_ROUTES,
    SETTING_KEYS.BLOG_SHARE_MODE,
  ]
  const data = await getSettings(keys)
  appStore.hydrateAppearance(data)

  // 回显列表样式
  const listTypeVal = data[SETTING_KEYS.ARTICLE_LIST_TYPE]?.value
  if (listTypeVal && typeof listTypeVal === 'string')
  
    currentListType.value = listTypeVal as ArticleList
  
  // 回显首页排序（服务端无则用 appStore 当前值）
  const homeSortVal = data[SETTING_KEYS.HOME_SORT]?.value
  if (homeSortVal && typeof homeSortVal === 'string' && ['date', 'hot', 'likes', 'trending'].includes(homeSortVal))
  
    currentHomeSort.value = homeSortVal as HomeSortType
  
  else
  
    currentHomeSort.value = appStore.homeSort ?? HOME_SORT_DEFAULT
  

  // 回显字符串型设置
  const stringFormKeys: Array<'openai_api_key' | 'openai_base_url' | 'openai_model' | 'site_name' | 'site_description' | 'site_keywords' | 'site_favicon'> = [
    'openai_api_key',
    'openai_base_url',
    'openai_model',
    'site_name',
    'site_description',
    'site_keywords',
    'site_favicon',
  ]
  for (const key of stringFormKeys)
  {
    const item = data[key]
    if (!item) continue
    const val = item.value
    if (MASKED_SETTING_KEYS.has(key))
    {
      if (item.masked)
      {
        form[key] = ''
        maskedHints[key] = typeof val === 'string' ? val : '***'
      }
      else if (typeof val === 'string')
      
        form[key] = val
      
    }
    else
    
      form[key] = typeof val === 'string' ? val : String(val ?? '')
    
  }

  // 回显数值型模型参数
  const tempVal = data[SETTING_KEYS.OPENAI_TEMPERATURE]?.value
  if (tempVal != null) form.openai_temperature = Number(tempVal) || 0.7
  const maxVal = data[SETTING_KEYS.OPENAI_MAX_TOKENS]?.value
  if (maxVal != null) form.openai_max_tokens = Number(maxVal) || 2048
  const ctxVal = data[SETTING_KEYS.OPENAI_CONTEXT_LENGTH]?.value
  if (ctxVal != null) form.openai_context_length = Number(ctxVal) || 20
  const promptVal = data[SETTING_KEYS.OPENAI_SYSTEM_PROMPT]?.value
  if (typeof promptVal === 'string') form.openai_system_prompt = promptVal

  // 博客偏好
  const oaVal = data[SETTING_KEYS.ONLY_OWN_ARTICLES]?.value
  blogForm.only_own_articles = oaVal === 'true' || oaVal === true
  const flnVal = data[SETTING_KEYS.FRIEND_LINK_NOTIFY]?.value
  blogForm.friend_link_notify = flnVal !== 'false' && flnVal !== false // 默认开启
  const vrVal = data[SETTING_KEYS.VISIBLE_ROUTES]?.value
  if (typeof vrVal === 'string')
  {
    try
    {
      blogForm.visible_routes = JSON.parse(vrVal)
    }
    catch
    { /* 保持默认 */ }
  }
  // 分享模式：从服务端读取（安全，不可被访客篡改）
  const smVal = data[SETTING_KEYS.BLOG_SHARE_MODE]?.value
  if (smVal === 'full' || smVal === 'readonly')
  
    blogForm.share_mode = smVal
  
}

/** 提交时敏感项：若前端为空且后端已脱敏，则不传该 key，避免覆盖为空白 */
async function saveModelSettings()
{
  savingModel.value = true
  try
  {
    const record: Record<string, { value: unknown }> = {}
    // base_url / model：有值则发送，空值跳过以保留服务端原值
    if (form.openai_base_url?.trim()) record[SETTING_KEYS.OPENAI_BASE_URL] = { value: form.openai_base_url.trim() }
    if (form.openai_model?.trim()) record[SETTING_KEYS.OPENAI_MODEL] = { value: form.openai_model.trim() }
    // API Key：非空时加密传输，空值跳过以保留服务端加密存储的原值
    if (form.openai_api_key?.trim())
    
      record[SETTING_KEYS.OPENAI_API_KEY] = { value: await encryptForTransport(form.openai_api_key.trim()) }
    
    // 数值型参数：始终发送
    record[SETTING_KEYS.OPENAI_TEMPERATURE] = { value: form.openai_temperature }
    record[SETTING_KEYS.OPENAI_MAX_TOKENS] = { value: form.openai_max_tokens }
    record[SETTING_KEYS.OPENAI_SYSTEM_PROMPT] = { value: form.openai_system_prompt }
    record[SETTING_KEYS.OPENAI_CONTEXT_LENGTH] = { value: form.openai_context_length }
    await updateSettings(record)
    await loadServerSettings()
    // 通知全局 AI 工具栏重新检测模型配置状态
    window.dispatchEvent(new CustomEvent('u-blog:settings-saved'))
    UMessageFn({ message: t('settings.modelSaved'), type: 'success' })
  }
  catch (err: any)
  {
    UMessageFn({ message: err?.message || t('settings.saveFailed'), type: 'error' })
  }
  finally
  {
    savingModel.value = false
  }
}

async function saveSiteSettings()
{
  savingSite.value = true
  try
  {
    await updateSettings({
      [SETTING_KEYS.SITE_NAME]: { value: form.site_name },
      [SETTING_KEYS.SITE_DESCRIPTION]: { value: form.site_description },
      [SETTING_KEYS.SITE_KEYWORDS]: { value: form.site_keywords },
      [SETTING_KEYS.SITE_FAVICON]: { value: form.site_favicon },
    })
    await loadServerSettings()
    // 保存后立即刷新页面标题
    appStore.updateDocumentTitle(t('settings.siteInfo'))
    UMessageFn({ message: t('settings.siteSaved'), type: 'success' })
  }
  catch (err: any)
  {
    UMessageFn({ message: err?.message || t('settings.saveFailed'), type: 'error' })
  }
  finally
  {
    savingSite.value = false
  }
}

/* ---------- 博客偏好设置 ---------- */

const { isLoggedIn } = storeToRefs(useUserStore())

/** 博客偏好表单 */
const blogForm = reactive({
  only_own_articles: false,
  friend_link_notify: true,
  visible_routes: ['home', 'archive', 'message', 'links', 'chat', 'about'] as string[],
  share_mode: 'readonly' as 'readonly' | 'full',
})

/** 可选路由列表 */
const routeOptions = computed(() => [
  { value: 'home', label: t('nav.home') },
  { value: 'archive', label: t('nav.archive') },
  { value: 'message', label: t('nav.message') },
  { value: 'links', label: t('nav.links') },
  { value: 'chat', label: t('nav.chat') },
  { value: 'about', label: t('nav.about') },
])

/** 切换路由可见性 */
function toggleVisibleRoute(route: string)
{
  const idx = blogForm.visible_routes.indexOf(route)
  if (idx >= 0)
  {
    // 至少保留一个路由
    if (blogForm.visible_routes.length > 1) blogForm.visible_routes.splice(idx, 1)
  }
  else
  
    blogForm.visible_routes.push(route)
  
}

/** 保存博客偏好 */
async function saveBlogSettings()
{
  savingBlog.value = true
  try
  {
    await updateSettings({
      [SETTING_KEYS.ONLY_OWN_ARTICLES]: { value: String(blogForm.only_own_articles) },
      [SETTING_KEYS.FRIEND_LINK_NOTIFY]: { value: String(blogForm.friend_link_notify) },
      [SETTING_KEYS.VISIBLE_ROUTES]: { value: JSON.stringify(blogForm.visible_routes) },
      [SETTING_KEYS.BLOG_SHARE_MODE]: { value: blogForm.share_mode },
    })
    UMessageFn({ message: t('settings.blogSaved'), type: 'success' })
  }
  catch (err: any)
  {
    UMessageFn({ message: err?.message || t('settings.saveFailed'), type: 'error' })
  }
  finally
  {
    savingBlog.value = false
  }
}

onMounted(() =>
{
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

  /* 非管理员本地保存提示 */
  &__local-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1.15rem;
    color: var(--u-warning, #e6a23c);
    background: rgba(230, 162, 60, 0.08);
    border: 1px solid rgba(230, 162, 60, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    margin: -8px 0 16px;
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

  &__desc-text {
    margin: 6px 0 0;
    font-size: 1.1rem;
    color: var(--u-text-3);
    line-height: 1.5;
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
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /** 标签右侧的数值徽标 */
  &__value {
    font-size: 1.15rem;
    font-weight: 500;
    color: var(--u-primary);
    background: var(--u-primary-light, rgba(var(--u-primary-rgb, 59,130,246), 0.1));
    padding: 1px 8px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }

  /** 表单项说明文字 */
  &__hint {
    font-size: 1.1rem;
    color: var(--u-text-3);
    line-height: 1.4;
  }

  &__input {
    width: 100%;
    max-width: 500px;
  }

  /** 滑块容器 */
  &__slider {
    width: 100%;
    max-width: 500px;
  }

  /** 多行文本域 */
  &__textarea {
    width: 100%;
    max-width: 500px;
    padding: 10px 12px;
    border: 1px solid var(--u-border-1);
    border-radius: 8px;
    background: var(--u-background-1);
    color: var(--u-text-1);
    font-size: 1.25rem;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;

    &::placeholder {
      color: var(--u-text-4);
    }

    &:focus {
      border-color: var(--u-primary);
      box-shadow: 0 0 0 2px rgba(var(--u-primary-rgb, 59,130,246), 0.15);
    }
  }

  &__actions {
    margin-top: 8px;
  }

  /** 站点图标预览行 */
  &__favicon-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  &__favicon-preview-wrap {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid var(--u-border-1);
    background: var(--u-background-2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__favicon-preview {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__favicon-empty {
    color: var(--u-text-4);
    font-size: 1.8rem;
  }

  &__favicon-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__favicon-btns {
    display: flex;
    gap: 8px;
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

    &__input,
    &__slider,
    &__textarea {
      max-width: 100%;
    }
  }
}
</style>
