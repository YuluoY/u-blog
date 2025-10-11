import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

export const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: {
    en,
    zh
  },
  legcy: true
})

export default i18n
