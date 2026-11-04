import { useState, useEffect, type ReactNode } from 'react'
import { translations } from './translations'
import type { Locale } from './translations'
import { I18nContext } from './useTranslation'

function detectLocale(): Locale {
  const lang = (
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    'fr'
  ).toLowerCase()
  return lang.startsWith('fr') ? 'fr' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => detectLocale())

  // Met à jour si l'utilisateur change la langue du système (rare mais propre)
  useEffect(() => {
    const handler = () => setLocale(detectLocale())
    window.addEventListener('languagechange', handler)
    return () => window.removeEventListener('languagechange', handler)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale] as any, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}
