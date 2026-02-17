import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

// legacy: false 才能在各组件 setup 中使用 useI18n()
export const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: {
    en,
    zh
  },
  legacy: false
})

export default i18n
