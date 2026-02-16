import { watch } from 'vue'
import { useRoutes } from '@/composables/useRoutes'
import { useState } from '@u-blog/composables'
import type { Language, Theme } from '@u-blog/model'
import { CTheme } from '@u-blog/model'
import type { ArticleList } from '@/types'
import { STORAGE_KEYS } from '@/constants/storage'
import { CArticleList } from '@/types/const'
import { defineStore } from 'pinia'

function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.THEME)
    if (v === CTheme.DARK || v === CTheme.LIGHT || v === CTheme.DEFAULT) return v
    return CTheme.DEFAULT
  } catch {
    return CTheme.DEFAULT
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

  watch(theme, (t) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, t ?? CTheme.DEFAULT)
    } catch { /* ignore */ }
  }, { immediate: true })
  const [language, setLanguage] = useState<Language | null>(null, (l: Language | null) => l && document.documentElement.setAttribute('lang', l))
  const [articleListType, setArticleListType] = useState<ArticleList>(CArticleList.BASE)

  /** 设置主题（不带动画），watch 会同步到 DOM 和本地缓存 */
  function setTheme(t: Theme | null) {
    setThemeState(t)
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
        setThemeState(nextTheme)
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
      setThemeState(nextTheme)
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
  }
})
