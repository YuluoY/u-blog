import { watch, computed } from 'vue'
import { useRoutes } from '@/composables/useRoutes'
import { useState } from '@u-blog/composables'
import type { Language, Theme } from '@u-blog/model'
import { CTheme, CLanguage } from '@u-blog/model'
import type { ArticleList } from '@/types'
import { STORAGE_KEYS } from '@/constants/storage'
import { SETTING_KEYS } from '@/constants/settings'
import { CArticleList } from '@/types/const'
import { defineStore } from 'pinia'
import { updateSettings } from '@/api/settings'
import type { SettingsMap } from '@/api/settings'

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
  function loadArticleListType(): ArticleList {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.ARTICLE_LIST_TYPE)
      if (v === CArticleList.BASE || v === CArticleList.CARD || v === CArticleList.WATERFALL || v === CArticleList.COMPACT) return v
      return CArticleList.BASE
    } catch {
      return CArticleList.BASE
    }
  }
  const [articleListTypeState, setArticleListTypeState] = useState<ArticleList>(loadArticleListType())
  /** 用 computed 暴露并兜底，避免 ShallowRef 在 Pinia 下未被正确追踪导致首页不更新 */
  const articleListType = computed<ArticleList>(() => articleListTypeState.value || CArticleList.BASE)
  function setArticleListType(v: ArticleList) {
    setArticleListTypeState(v)
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLE_LIST_TYPE, v)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.ARTICLE_LIST_TYPE]: { value: v } }).catch(() => {})
  }

  /** 从接口项中取出标量（兼容 value 为对象 { value: x } 或直接为 x） */
  function toScalar(item: { value: unknown } | null | undefined): unknown {
    if (item?.value == null) return undefined
    const raw = item.value
    if (typeof raw === 'object' && raw !== null && 'value' in raw) return (raw as { value: unknown }).value
    return raw
  }

  /** 用服务端设置回填外观（主题、语言、列表样式），并写回 localStorage */
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
  }

  /** 设置主题（不带动画），watch 会同步到 DOM 和本地缓存，并入库 */
  function setTheme(t: Theme | null) {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, t ?? CTheme.DEFAULT)
    } catch { /* ignore */ }
    updateSettings({ [SETTING_KEYS.THEME]: { value: t ?? CTheme.DEFAULT } }).catch(() => {})
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
    articleListType,

    refreshRoutes,
    replRoutes,
    addRoutes,
    sortedRoutes,
    setTheme,
    setLanguage,
    setArticleListType,
    toggleTheme,
    hydrateAppearance,
  }
})
