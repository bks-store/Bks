import { useContext, createContext } from 'react'
import type { Locale, Translations } from './translations'
import { translations } from './translations'

export interface I18nContextValue {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'fr',
  t: translations.fr,
  setLocale: () => {},
})

export function useTranslation() {
  return useContext(I18nContext)
}
