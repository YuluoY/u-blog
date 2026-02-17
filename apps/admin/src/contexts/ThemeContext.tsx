import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'
import { theme as baseTheme } from '../styles/theme'

const STORAGE_THEME = 'u-blog-admin-theme'

export type ThemeMode = 'light' | 'dark'

function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_THEME) as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export interface ThemeContextValue {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  /** 切换主题并执行从点击处圆形扩散（不盖住内容，与 frontend 一致） */
  toggleThemeWithTransition: (event?: React.MouseEvent) => void
  themeConfig: ThemeConfig
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredThemeMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem(STORAGE_THEME, mode)
  }, [])

  const toggleThemeWithTransition = useCallback(
    (event?: React.MouseEvent) => {
      const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark'
      const x = event?.clientX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)
      const y = event?.clientY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)
      const maxRadius =
        typeof window !== 'undefined'
          ? Math.hypot(
              Math.max(x, window.innerWidth - x),
              Math.max(y, window.innerHeight - y),
            )
          : 1000

      const startVT = (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition
      if (typeof document !== 'undefined' && startVT) {
        const transition = startVT.call(document, () => {
          setThemeMode(nextMode)
        })
        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: 'ease-in-out',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
      } else {
        setThemeMode(nextMode)
      }
    },
    [themeMode],
  )

  const themeConfig: ThemeConfig = useMemo(
    () => ({
      ...baseTheme,
      algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    }),
    [themeMode],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, setThemeMode, toggleThemeWithTransition, themeConfig }),
    [themeMode, setThemeMode, toggleThemeWithTransition],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
