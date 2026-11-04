import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_RUBRIQUES, loadContent, mediaUrl, onContentChange,
  type MediaKey, type Rubrique, type SiteContent,
} from '../lib/content'

interface ContentValue {
  content: SiteContent
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  media: (key: MediaKey) => string
  visibleRubriques: Rubrique[]
  rubriqueBySlug: (slug: string) => Rubrique | undefined
}

const ContentContext = createContext<ContentValue | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>({ rubriques: DEFAULT_RUBRIQUES, media: {}, storePhotos: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setContent(await loadContent())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Contenu indisponible')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    return onContentChange(reload)
  }, [reload])

  const value = useMemo<ContentValue>(() => {
    const visibleRubriques = content.rubriques.filter(r => r.isVisible)
    return {
      content, loading, error, reload,
      media: key => mediaUrl(content, key),
      visibleRubriques,
      rubriqueBySlug: slug => visibleRubriques.find(r => r.slug === slug),
    }
  }, [content, loading, error, reload])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
