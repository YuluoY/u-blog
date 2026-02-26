import { watch, computed, ref } from 'vue'
import { useRoutes } from '@/composables/useRoutes'
import { useState } from '@u-blog/composables'
import type { Language, Theme, VisualStyle } from '@u-blog/model'
import { CTheme, CLanguage, CVisualStyle } from '@u-blog/model'
import type { ArticleList } from '@/types'
import { STORAGE_KEYS } from '@/constants/storage'
import { SETTING_KEYS } from '@/constants/settings'
import { CArticleList } from '@/types/const'
import { CArchiveCardStyle, ARCHIVE_CARD_STYLE_DEFAULT } from '@/constants/archive'
import type { ArchiveCardStyle } from '@/constants/archive'
import { defineStore } from 'pinia'
import { updateSettings } from '@/api/settings'
import type { SettingsMap } from '@/api/settings'
import type { HomeSortType } from '@/api/article'
import { HOME_SORT_DEFAULT } from '@/api/article'

function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.THEME)
    if (v === CTheme.DARK || v === CTheme.LIGHT || v === CTheme.DEFAULT) return v
    return CTheme.DEFAULT
  } catch {
    return CTheme.DEFAULT
  }
}

function loadLanguage(): Language {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    if (v === CLanguage.ZH || v === CLanguage.EN) return v
    return CLanguage.ZH
  } catch {
    return CLanguage.ZH
  }
}

function loadVisualStyle(): VisualStyle {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.VISUAL_STYLE)
    if (v === CVisualStyle.DEFAULT || v === CVisualStyle.GLASS) return v
    return CVisualStyle.DEFAULT
  } catch {
    return CVisualStyle.DEFAULT
  }
}

function loadArchiveCardStyle(): ArchiveCardStyle {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.ARCHIVE_CARD_STYLE)
    if (v && Object.values(CArchiveCardStyle).includes(v as ArchiveCardStyle)) return v as ArchiveCardStyle
  } catch {}
  return ARCHIVE_CARD_STYLE_DEFAULT
}

export type SnowfallMode = 'off' | 'auto' | 'on'
export const C_SNOWFALL_MODE = { OFF: 'off', AUTO: 'auto', ON: 'on' } as const

function loadSnowfallMode(): SnowfallMode {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_MODE)
    if (v === 'off' || v === 'auto' || v === 'on') return v
  } catch {}
  return 'auto'
}

function loadSnowfallCount(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_COUNT)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 8 && n <= 120) return n
    }
  } catch {}
  return 48
}

function loadSnowfallZIndex(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_Z_INDEX)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 1 && n <= 99999) return n
    }
  } catch {}
  return 9998
}

function loadSnowfallThemePreset(): 'default' | 'ice' {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_THEME_PRESET)
    if (v === 'default' || v === 'ice') return v
  } catch {}
  return 'default'
}

function loadSnowfallSizeMin(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_SIZE_MIN)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 2 && n <= 24) return n
    }
  } catch {}
  return 4
}

function loadSnowfallSizeMax(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_SIZE_MAX)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 2 && n <= 24) return n
    }
  } catch {}
  return 10
}

function loadSnowfallSpeed(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_SPEED)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 1 && n <= 10) return n
    }
  } catch {}
  return 5
}

function loadSnowfallDistribution(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SNOWFALL_DISTRIBUTION)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 0 && n <= 100) return n
    }
  } catch {}
  return 100
}

/* ---------- 排版配置加载 ---------- */
export type FontFamilyPreset = 'system' | 'serif' | 'mono'
export const C_FONT_FAMILY_PRESET = { SYSTEM: 'system', SERIF: 'serif', MONO: 'mono' } as const

/** 字体族预设映射 */
const FONT_FAMILY_MAP: Record<FontFamilyPreset, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  serif: 'Georgia, "Noto Serif SC", "Source Han Serif SC", "Times New Roman", serif',
  mono: '"Fira Code", "JetBrains Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace',
}

function loadFontSizeScale(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.FONT_SIZE_SCALE)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 80 && n <= 130) return n
    }
  } catch {}
  return 100
}

function loadLineHeightScale(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.LINE_HEIGHT_SCALE)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 100 && n <= 200) return n
    }
  } catch {}
  return 150
}

function loadContentSpacingScale(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.CONTENT_SPACING_SCALE)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= 50 && n <= 150) return n
    }
  } catch {}
  return 100
}

function loadFontFamilyPreset(): FontFamilyPreset {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.FONT_FAMILY_PRESET)
    if (v === 'system' || v === 'serif' || v === 'mono') return v
  } catch {}
  return 'system'
}

export const useAppStore = defineStore('app', () =>
{
  const {
    routes,
    replRoutes,
    addRoutes,
    refreshRoutes,
    sortedRoutes
  } = useRoutes()

  /** 应用主题到 DOM：同时设 attribute 和 class（兼容 UI 库 :root.dark） */
  function applyTheme(t: Theme | null) {
    if (!t) return
    const el = document.documentElement
    el.setAttribute('theme', t)
    // UI 库 dark 主题匹配 :root.dark
    if (t === CTheme.DARK) {
      el.classList.add('dark')
    } else {
      el.classList.remove('dark')
    }
  }

  const [theme, setThemeState] = useState<Theme | null>(loadTheme())

  watch(theme, (t) => {
    if (t) applyTheme(t)
  }, { immediate: true })

  const [language, setLanguageState] = useState<Language | null>(loadLanguage(), (l: Language | null) => l && document.documentElement.setAttribute('lang', l))

  function applyVisualStyle(v: VisualStyle | null) {
    if (!v) return
    const el = document.documentElement
    if (v === CVisualStyle.GLASS) {
      el.setAttribute('theme-style', 'glass')
    } else {
      el.removeAttribute('theme-style')
    }
  }

  const [visualStyle, setVisualStyleState] = useState<VisualStyle | null>(loadVisualStyle())

  watch(visualStyle, (v) => {
    if (v) applyVisualStyle(v)
  }, { immediate: true })

  function setVisualStyle(v: VisualStyle | null) {
    setVisualStyleState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.VISUAL_STYLE, v ?? CVisualStyle.DEFAULT)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.VISUAL_STYLE]: { value: v ?? CVisualStyle.DEFAULT } }).catch(() => {})
  }

  function setLanguage(l: Language | null) {
    setLanguageState(l)
    if (l) {
      try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, l)
      } catch { /* ignore */ }
      updateSettings({ [SETTING_KEYS.LANGUAGE]: { value: l } }).catch(() => {})
      // locale 同步在 App.vue 的 watch 中做，保证在 Vue 响应式上下文中触发重渲染
    }
  }
  /** 根据屏幕宽度获取默认列表类型：移动端(<=375px)默认卡片视图，桌面端默认基础视图 */
  function getDefaultListType(): ArticleList {
    if (typeof window !== 'undefined' && window.innerWidth <= 375) {
      return CArticleList.CARD
    }
    return CArticleList.BASE
  }
  function loadArticleListType(): ArticleList {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.ARTICLE_LIST_TYPE)
      if (v === CArticleList.BASE || v === CArticleList.CARD || v === CArticleList.WATERFALL || v === CArticleList.COMPACT) return v
      return getDefaultListType()
    } catch {
      return getDefaultListType()
    }
  }
  const [articleListTypeState, setArticleListTypeState] = useState<ArticleList>(loadArticleListType())
  /** 用 computed 暴露并兜底，避免 ShallowRef 在 Pinia 下未被正确追踪导致首页不更新 */
  const articleListType = computed<ArticleList>(() => articleListTypeState.value || getDefaultListType())
  function setArticleListType(v: ArticleList) {
    setArticleListTypeState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLE_LIST_TYPE, v)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.ARTICLE_LIST_TYPE]: { value: v } }).catch(() => {})
  }

  const HOME_SORT_VALID: HomeSortType[] = ['date', 'hot', 'likes', 'trending']
  function loadHomeSort(): HomeSortType {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.HOME_SORT)
      if (v && HOME_SORT_VALID.includes(v as HomeSortType)) return v as HomeSortType
    } catch {}
    return HOME_SORT_DEFAULT
  }
  const [homeSortState, setHomeSortState] = useState<HomeSortType>(loadHomeSort())
  const homeSort = computed<HomeSortType>(() => homeSortState.value ?? HOME_SORT_DEFAULT)
  function setHomeSort(v: HomeSortType) {
    setHomeSortState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.HOME_SORT, v)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.HOME_SORT]: { value: v } }).catch(() => {})
  }

  const [archiveCardStyleState, setArchiveCardStyleState] = useState<ArchiveCardStyle>(loadArchiveCardStyle())
  const archiveCardStyle = computed<ArchiveCardStyle>(() => archiveCardStyleState.value ?? ARCHIVE_CARD_STYLE_DEFAULT)
  function setArchiveCardStyle(v: ArchiveCardStyle) {
    setArchiveCardStyleState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.ARCHIVE_CARD_STYLE, v)
    } catch { /* ignore */ }
  }

  /* ---------- 站点元信息（title / favicon） ---------- */
  /** 默认站点名称 */
  const DEFAULT_SITE_NAME = 'U-Blog'
  /** 站点名称（从服务端设置加载，用于 document.title 等） */
  const siteName = ref<string>(DEFAULT_SITE_NAME)
  /** 站点图标 URL（从服务端设置加载，动态更新 <link rel="icon">） */
  const siteFavicon = ref<string>('')
  /** 是否仅展示当前用户自己的文章 */
  const onlyOwnArticles = ref(false)
  function setOnlyOwnArticles(v: boolean) { onlyOwnArticles.value = v }

  /* ---------- 排版配置 ---------- */

  /** 将排版设置应用到 CSS 自定义属性 */
  function applyTypography(
    fontScale: number,
    lineHeightScale: number,
    spacingScale: number,
    fontPreset: FontFamilyPreset
  ) {
    const el = document.documentElement
    // 根 font-size 基准为 10px(62.5%)，按比例缩放
    el.style.setProperty('--u-global-font-scale', String(fontScale / 100))
    // 使用百分比缩放行高，配合具体组件使用
    el.style.setProperty('--u-global-line-height', String(lineHeightScale / 100))
    // 间距缩放因子
    el.style.setProperty('--u-global-spacing-scale', String(spacingScale / 100))
    // 字体族
    el.style.setProperty('--u-font-family', FONT_FAMILY_MAP[fontPreset])
    // 同步缩放 html 根 font-size（默认为 62.5%，即 10px 基准）
    el.style.fontSize = `${62.5 * (fontScale / 100)}%`
  }

  const [fontSizeScaleState, setFontSizeScaleState] = useState(loadFontSizeScale())
  const fontSizeScale = computed(() => fontSizeScaleState.value ?? 100)
  const [lineHeightScaleState, setLineHeightScaleState] = useState(loadLineHeightScale())
  const lineHeightScale = computed(() => lineHeightScaleState.value ?? 150)
  const [contentSpacingScaleState, setContentSpacingScaleState] = useState(loadContentSpacingScale())
  const contentSpacingScale = computed(() => contentSpacingScaleState.value ?? 100)
  const [fontFamilyPresetState, setFontFamilyPresetState] = useState<FontFamilyPreset>(loadFontFamilyPreset())
  const fontFamilyPreset = computed<FontFamilyPreset>(() => fontFamilyPresetState.value ?? 'system')

  // 初始化时立即应用
  applyTypography(fontSizeScale.value, lineHeightScale.value, contentSpacingScale.value, fontFamilyPreset.value)

  // 监听排版变化并应用
  watch([fontSizeScale, lineHeightScale, contentSpacingScale, fontFamilyPreset], ([fs, lh, sp, ff]) => {
    applyTypography(fs, lh, sp, ff)
  })

  function setFontSizeScale(v: number) {
    const n = Math.max(80, Math.min(130, v))
    setFontSizeScaleState(n)
    try { localStorage.setItem(STORAGE_KEYS.FONT_SIZE_SCALE, String(n)) } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.FONT_SIZE_SCALE]: { value: String(n) } }).catch(() => {})
  }
  function setLineHeightScale(v: number) {
    const n = Math.max(100, Math.min(200, v))
    setLineHeightScaleState(n)
    try { localStorage.setItem(STORAGE_KEYS.LINE_HEIGHT_SCALE, String(n)) } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.LINE_HEIGHT_SCALE]: { value: String(n) } }).catch(() => {})
  }
  function setContentSpacingScale(v: number) {
    const n = Math.max(50, Math.min(150, v))
    setContentSpacingScaleState(n)
    try { localStorage.setItem(STORAGE_KEYS.CONTENT_SPACING_SCALE, String(n)) } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.CONTENT_SPACING_SCALE]: { value: String(n) } }).catch(() => {})
  }
  function setFontFamilyPreset(v: FontFamilyPreset) {
    setFontFamilyPresetState(v)
    try { localStorage.setItem(STORAGE_KEYS.FONT_FAMILY_PRESET, v) } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.FONT_FAMILY_PRESET]: { value: v } }).catch(() => {})
  }

  function setSiteName(name: string) {
    siteName.value = name || DEFAULT_SITE_NAME
  }

  /** 动态更新 <link rel="icon"> 的 href */
  function applySiteFavicon(url: string) {
    if (!url) return
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
    // 根据扩展名设置 type
    if (url.endsWith('.svg')) link.type = 'image/svg+xml'
    else if (url.endsWith('.png')) link.type = 'image/png'
    else if (url.endsWith('.ico')) link.type = 'image/x-icon'
    else link.removeAttribute('type')
  }

  function setSiteFavicon(url: string) {
    siteFavicon.value = url
    if (url) applySiteFavicon(url)
  }

  /** 更新当前页面 document.title，格式：{pageTitle} - {siteName} */
  function updateDocumentTitle(pageTitle?: string) {
    const name = siteName.value || DEFAULT_SITE_NAME
    document.title = pageTitle ? `${pageTitle} - ${name}` : name
  }

  const [snowfallModeState, setSnowfallModeState] = useState<SnowfallMode>(loadSnowfallMode())
  const snowfallMode = computed<SnowfallMode>(() => snowfallModeState.value ?? 'off')
  const [snowfallCountState, setSnowfallCountState] = useState(loadSnowfallCount())
  const snowfallCount = computed(() => snowfallCountState.value ?? 48)
  const [snowfallZIndexState, setSnowfallZIndexState] = useState(loadSnowfallZIndex())
  const snowfallZIndex = computed(() => snowfallZIndexState.value ?? 9998)
  const [snowfallThemePresetState, setSnowfallThemePresetState] = useState(loadSnowfallThemePreset())
  const snowfallThemePreset = computed(() => snowfallThemePresetState.value ?? 'default')
  const [snowfallSizeMinState, setSnowfallSizeMinState] = useState(loadSnowfallSizeMin())
  const snowfallSizeMin = computed(() => snowfallSizeMinState.value ?? 4)
  const [snowfallSizeMaxState, setSnowfallSizeMaxState] = useState(loadSnowfallSizeMax())
  const snowfallSizeMax = computed(() => snowfallSizeMaxState.value ?? 10)
  const [snowfallSpeedState, setSnowfallSpeedState] = useState(loadSnowfallSpeed())
  const snowfallSpeed = computed(() => snowfallSpeedState.value ?? 5)
  const [snowfallDistributionState, setSnowfallDistributionState] = useState(loadSnowfallDistribution())
  const snowfallDistribution = computed(() => snowfallDistributionState.value ?? 100)
  const todayHasSnow = ref<boolean>(false)

  function setSnowfallMode(v: SnowfallMode) {
    setSnowfallModeState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_MODE, v)
    } catch { /* ignore */ }
  }
  function setSnowfallCount(v: number) {
    const n = Math.max(8, Math.min(120, v))
    setSnowfallCountState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_COUNT, String(n))
    } catch { /* ignore */ }
  }
  function setSnowfallZIndex(v: number) {
    const n = Math.max(1, Math.min(99999, v))
    setSnowfallZIndexState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_Z_INDEX, String(n))
    } catch { /* ignore */ }
  }
  function setSnowfallThemePreset(v: 'default' | 'ice') {
    setSnowfallThemePresetState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_THEME_PRESET, v)
    } catch { /* ignore */ }
  }
  function setSnowfallSizeMin(v: number) {
    const n = Math.max(2, Math.min(24, v))
    setSnowfallSizeMinState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_SIZE_MIN, String(n))
    } catch { /* ignore */ }
  }
  function setSnowfallSizeMax(v: number) {
    const n = Math.max(2, Math.min(24, v))
    setSnowfallSizeMaxState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_SIZE_MAX, String(n))
    } catch { /* ignore */ }
  }
  function setSnowfallSpeed(v: number) {
    const n = Math.max(1, Math.min(10, v))
    setSnowfallSpeedState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_SPEED, String(n))
    } catch { /* ignore */ }
  }
  function setSnowfallDistribution(v: number) {
    const n = Math.max(0, Math.min(100, v))
    setSnowfallDistributionState(n)
    try {
      localStorage.setItem(STORAGE_KEYS.SNOWFALL_DISTRIBUTION, String(n))
    } catch { /* ignore */ }
  }
  function setTodayHasSnow(v: boolean) {
    todayHasSnow.value = v
  }

  const snowfallThemeColors = computed(() => {
    if (snowfallThemePreset.value === 'ice') {
      return [
        'rgba(255,255,255,0.95)',
        'rgba(200,220,255,0.9)',
        'rgba(180,210,255,0.85)',
        'rgba(220,235,255,0.9)',
        'rgba(190,220,255,0.88)'
      ]
    }
    return [
      'var(--u-primary)',
      'var(--u-success)',
      'var(--u-warning)',
      'var(--u-danger)',
      'var(--u-info)'
    ]
  })

  const snowfallOptions = computed(() => {
    const speed = snowfallSpeed.value
    const durationMin = Math.round(6 + (10 - speed) * 2.5)
    const durationMax = durationMin + 8
    return {
      count: snowfallCount.value,
      zIndex: snowfallZIndex.value,
      themeColors: snowfallThemeColors.value,
      sizeMin: snowfallSizeMin.value,
      sizeMax: snowfallSizeMax.value,
      durationMin,
      durationMax,
      distribution: snowfallDistribution.value
    }
  })

  /** 从接口项中取出标量（兼容 value 为对象 { value: x } 或直接为 x） */
  function toScalar(item: { value: unknown } | null | undefined): unknown {
    if (item?.value == null) return undefined
    const raw = item.value
    if (typeof raw === 'object' && raw !== null && 'value' in raw) return (raw as { value: unknown }).value
    return raw
  }

  /** 用服务端设置回填外观（主题、语言、列表样式、视觉样式），并写回 localStorage */
  function hydrateAppearance(settingsMap: SettingsMap) {
    const themeVal = toScalar(settingsMap[SETTING_KEYS.THEME])
    if (themeVal != null) {
      const v = String(themeVal).trim()
      if (v === CTheme.DARK || v === CTheme.LIGHT || v === CTheme.DEFAULT) {
        setThemeState(v)
        try {
          localStorage.setItem(STORAGE_KEYS.THEME, v)
        } catch { /* ignore */ }
      }
    }
    const langVal = toScalar(settingsMap[SETTING_KEYS.LANGUAGE])
    if (langVal != null) {
      const v = String(langVal).trim()
      if (v === CLanguage.ZH || v === CLanguage.EN) {
        setLanguageState(v)
        try {
          localStorage.setItem(STORAGE_KEYS.LANGUAGE, v)
        } catch { /* ignore */ }
      }
    }
    const listVal = toScalar(settingsMap[SETTING_KEYS.ARTICLE_LIST_TYPE])
    if (listVal != null) {
      const v = String(listVal).trim()
      if (v === CArticleList.BASE || v === CArticleList.CARD || v === CArticleList.WATERFALL || v === CArticleList.COMPACT) {
        setArticleListTypeState(v as ArticleList)
        try {
          localStorage.setItem(STORAGE_KEYS.ARTICLE_LIST_TYPE, v)
        } catch { /* ignore */ }
      }
    }
    const homeSortVal = toScalar(settingsMap[SETTING_KEYS.HOME_SORT])
    if (homeSortVal != null) {
      const v = String(homeSortVal).trim()
      if (HOME_SORT_VALID.includes(v as HomeSortType)) {
        setHomeSortState(v as HomeSortType)
        try {
          localStorage.setItem(STORAGE_KEYS.HOME_SORT, v)
        } catch { /* ignore */ }
      }
    }
    const visualVal = toScalar(settingsMap[SETTING_KEYS.VISUAL_STYLE])
    if (visualVal != null) {
      const v = String(visualVal).trim()
      if (v === CVisualStyle.DEFAULT || v === CVisualStyle.GLASS) {
        setVisualStyleState(v)
        try {
          localStorage.setItem(STORAGE_KEYS.VISUAL_STYLE, v)
        } catch { /* ignore */ }
      }
    }
    // 站点名称
    const siteNameVal = toScalar(settingsMap[SETTING_KEYS.SITE_NAME])
    if (siteNameVal != null) {
      setSiteName(String(siteNameVal).trim())
    }
    // 站点图标
    const siteFaviconVal = toScalar(settingsMap[SETTING_KEYS.SITE_FAVICON])
    if (siteFaviconVal != null) {
      setSiteFavicon(String(siteFaviconVal).trim())
    }
    // 仅展示自己文章
    const onlyOwnVal = toScalar(settingsMap[SETTING_KEYS.ONLY_OWN_ARTICLES])
    if (onlyOwnVal != null) {
      setOnlyOwnArticles(String(onlyOwnVal) === 'true')
    }
    // 排版：字号缩放
    const fontScaleVal = toScalar(settingsMap[SETTING_KEYS.FONT_SIZE_SCALE])
    if (fontScaleVal != null) {
      const n = parseInt(String(fontScaleVal), 10)
      if (!Number.isNaN(n) && n >= 80 && n <= 130) {
        setFontSizeScaleState(n)
        try { localStorage.setItem(STORAGE_KEYS.FONT_SIZE_SCALE, String(n)) } catch { /* ignore */ }
      }
    }
    // 排版：行高缩放
    const lineHeightVal = toScalar(settingsMap[SETTING_KEYS.LINE_HEIGHT_SCALE])
    if (lineHeightVal != null) {
      const n = parseInt(String(lineHeightVal), 10)
      if (!Number.isNaN(n) && n >= 100 && n <= 200) {
        setLineHeightScaleState(n)
        try { localStorage.setItem(STORAGE_KEYS.LINE_HEIGHT_SCALE, String(n)) } catch { /* ignore */ }
      }
    }
    // 排版：间距缩放
    const spacingVal = toScalar(settingsMap[SETTING_KEYS.CONTENT_SPACING_SCALE])
    if (spacingVal != null) {
      const n = parseInt(String(spacingVal), 10)
      if (!Number.isNaN(n) && n >= 50 && n <= 150) {
        setContentSpacingScaleState(n)
        try { localStorage.setItem(STORAGE_KEYS.CONTENT_SPACING_SCALE, String(n)) } catch { /* ignore */ }
      }
    }
    // 排版：字体族
    const fontFamilyVal = toScalar(settingsMap[SETTING_KEYS.FONT_FAMILY_PRESET])
    if (fontFamilyVal != null) {
      const v = String(fontFamilyVal).trim()
      if (v === 'system' || v === 'serif' || v === 'mono') {
        setFontFamilyPresetState(v)
        try { localStorage.setItem(STORAGE_KEYS.FONT_FAMILY_PRESET, v) } catch { /* ignore */ }
      }
    }
  }

  /** 设置主题（不带动画），watch 会同步到 DOM 和本地缓存，并入库 */
  function setTheme(t: Theme | null) {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, t ?? CTheme.DEFAULT)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.THEME]: { value: t ?? CTheme.DEFAULT } }).catch(() => {})
  }

  /** 设置抽屉是否可见（从左侧栏设置图标打开） */
  const settingsDrawerVisible = ref(false)
  function setSettingsDrawerVisible(v: boolean) {
    settingsDrawerVisible.value = v
  }

  /**
   * 切换主题 + 圆形扩散过渡动画
   * 使用 View Transitions API，从点击位置向外/向内扩散圆形遮罩
   * @param event 鼠标事件（用于获取点击坐标）
   */
  async function toggleTheme(event?: MouseEvent) {
    const nextTheme = theme.value === CTheme.DARK ? CTheme.DEFAULT : CTheme.DARK
    const x = event?.clientX ?? window.innerWidth / 2
    const y = event?.clientY ?? window.innerHeight / 2

    // 计算圆形遮罩的最大半径（从点击点到视口最远角的距离）
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // 支持 View Transitions API 的浏览器
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        setTheme(nextTheme)
      })

      transition.ready.then(() => {
        // 从点击位置向外圆形扩散
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)'
          }
        )
      })
    } else {
      setTheme(nextTheme)
    }
  }

  return {
    routes,
    theme,
    language,
    visualStyle,
    articleListType,
    settingsDrawerVisible,
    setSettingsDrawerVisible,

    refreshRoutes,
    replRoutes,
    addRoutes,
    sortedRoutes,
    setTheme,
    setLanguage,
    setVisualStyle,
    setArticleListType,
    homeSort,
    setHomeSort,
    archiveCardStyle,
    setArchiveCardStyle,
    toggleTheme,
    hydrateAppearance,

    siteName,
    siteFavicon,
    onlyOwnArticles,
    setSiteName,
    setSiteFavicon,
    setOnlyOwnArticles,
    updateDocumentTitle,

    snowfallMode,
    snowfallCount,
    snowfallZIndex,
    snowfallThemePreset,
    snowfallSizeMin,
    snowfallSizeMax,
    snowfallSpeed,
    snowfallDistribution,
    snowfallOptions,
    todayHasSnow,
    setSnowfallMode,
    setSnowfallCount,
    setSnowfallZIndex,
    setSnowfallThemePreset,
    setSnowfallSizeMin,
    setSnowfallSizeMax,
    setSnowfallSpeed,
    setSnowfallDistribution,
    setTodayHasSnow,

    fontSizeScale,
    lineHeightScale,
    contentSpacingScale,
    fontFamilyPreset,
    setFontSizeScale,
    setLineHeightScale,
    setContentSpacingScale,
    setFontFamilyPreset,
  }
})
