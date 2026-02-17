import dayjs from 'dayjs'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { zh } from '../locales/zh'
import { en } from '../locales/en'

const STORAGE_LANG = 'u-blog-admin-lang'

export type Lang = 'zh' | 'en'

export const defaultLang: Lang = (() => {
  if (typeof window === 'undefined') return 'zh'
  const stored = localStorage.getItem(STORAGE_LANG) as Lang | null
  if (stored === 'zh' || stored === 'en') return stored
  return 'zh'
})()

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: defaultLang,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

// 初始化 dayjs 语言与 defaultLang 一致（后续由 DayjsLocaleSync 随 i18n 切换）
dayjs.locale(defaultLang === 'en' ? 'en' : 'zh-cn')

export function setStoredLang(lang: Lang) {
  localStorage.setItem(STORAGE_LANG, lang)
}

export default i18n
