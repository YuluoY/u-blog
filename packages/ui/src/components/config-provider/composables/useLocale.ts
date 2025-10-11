import { inject, type Ref } from 'vue'
import { omit } from 'lodash-es'
import { createI18n, i18nSymbol, type I18nInstance } from 'vue3-i18n'
import { zhCn as DefLang, en as EnLang, type Language } from '@/locale'

const DEFAULT_LANG = 'zh-cn'

// 创建一个全局的 i18n 实例，并预先注册所有语言包
const globalI18n = createI18n({
  locale: DEFAULT_LANG,
  messages: {
    [DEFAULT_LANG]: DefLang.el,
    en: EnLang.el
  }
})

/**
 *
 * @param localeOverrides 语言包
 * @description 用于设置语言包
 * @example
 * ```ts
 * const locale = useLocale({
 *   locale: 'en',
 * })
 * ```
 * @returns
 */
export function useLocale(localeOverrides?: Ref<Language>)
{
  const i18n = inject(i18nSymbol, globalI18n) as I18nInstance & {
    setLocaleMessage: (locale: string, messages: any) => void
    locale: string
  }

  if (localeOverrides)
  {
    const { name, el } = localeOverrides.value
    // 如果是自定义的语言包，才需要重新注册
    if (name !== DEFAULT_LANG && name !== 'en')
    
      i18n.setLocaleMessage(name, el)
    
    i18n.locale = name
  }

  return omit(i18n, 'install')
}