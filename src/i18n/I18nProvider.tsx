import { useState, useEffect, type ReactNode } from 'react'
import { translations } from './translations'
import type { Locale } from './translations'
import { I18nContext } from './useTranslation'

const STORAGE_KEY = 'bks-locale'

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'en') return saved
  } catch {}
  const lang = (
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    'fr'
  ).toLowerCase()
  return lang.startsWith('fr') ? 'fr' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale())

  const setLocale = (l: Locale) => {
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    setLocaleState(l)
  }

  // Met à jour si l'utilisateur change la langue du système (sauf si choix manuel persisté)
  useEffect(() => {
    const handler = () => {
      try { if (localStorage.getItem(STORAGE_KEY)) return } catch {}
      setLocaleState(detectLocale())
    }
    window.addEventListener('languagechange', handler)
    return () => window.removeEventListener('languagechange', handler)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale] as any, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}
