import type { Language, TranslatePair } from '@/locale'

export interface UConfigProviderProps {
  locale?: Language
  extendsI18nMsg?: TranslatePair
}