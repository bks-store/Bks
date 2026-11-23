import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { IMAGES } from '../config/images'

// ── Semaphore: max 8 concurrent image loads ──────────────────────────────────
const MAX_CONCURRENT = 8
let activeLoads = 0
const loadQueue: Array<() => void> = []

function acquireSlot(cb: () => void) {
  if (activeLoads < MAX_CONCURRENT) { activeLoads++; cb() }
  else loadQueue.push(cb)
}

function releaseSlot() {
  activeLoads = Math.max(0, activeLoads - 1)
  if (loadQueue.length > 0 && activeLoads < MAX_CONCURRENT) {
    const next = loadQueue.shift()!
    activeLoads++
    next()
  }
}

// ── Single shared IntersectionObserver (500px ahead of viewport) ─────────────
let io: IntersectionObserver | null = null
const ioCallbacks = new WeakMap<Element, () => void>()

function getIO() {
  if (!io && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const cb = ioCallbacks.get(e.target)
            if (cb) { io!.unobserve(e.target); ioCallbacks.delete(e.target); cb() }
          }
        }
      },
      { rootMargin: '500px 0px' },
    )
  }
  return io
}

function optimizeUrl(src: string, width: number): string {
  if (!src.includes('supabase.co/storage')) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}width=${width}&quality=75&format=webp`
}

// Cache-buster pour forcer un vrai rechargement réseau sur les retries
function bustCache(url: string, attempt: number): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_r=${attempt}`
}

const MAX_RETRIES = 3
const LOAD_TIMEOUT_MS = 10000

interface Props {
  src?: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  fetchpriority?: 'high' | 'low' | 'auto'
  style?: CSSProperties
  imgWidth?: number
}

export default function SmartImage({ src, alt, className = '', loading = 'lazy', fetchpriority, style, imgWidth = 600 }: Props) {
  const isPriority = loading === 'eager' || fetchpriority === 'high'
  const optimized = src ? optimizeUrl(src, imgWidth) : src
  const [activeSrc, setActiveSrc] = useState<string | undefined>(isPriority ? optimized : undefined)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  const clearTimers = () => {
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null }
    if (timeoutTimer.current) { clearTimeout(timeoutTimer.current); timeoutTimer.current = null }
  }

  useEffect(() => () => clearTimers(), [])

  // Reset si src change (changement de produit)
  useEffect(() => {
    if (!optimized) return
    clearTimers()
    retryCount.current = 0
    setLoaded(false)
    setFailed(false)
    if (!isPriority) setActiveSrc(undefined)
    else setActiveSrc(optimized)
  }, [optimized])

  const scheduleRetry = (base: string) => {
    releaseSlot()
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current++
      const attempt = retryCount.current
      retryTimer.current = setTimeout(() => {
        setLoaded(false)
        const url = bustCache(base, attempt)
        setActiveSrc(url)
        timeoutTimer.current = setTimeout(() => scheduleRetry(base), LOAD_TIMEOUT_MS)
      }, 1000 * attempt)
    } else {
      setFailed(true)
    }
  }

  useEffect(() => {
    if (!optimized || isPriority || activeSrc) return
    const el = placeholderRef.current
    if (!el) return

    const startLoad = () => acquireSlot(() => {
      setActiveSrc(optimized)
      timeoutTimer.current = setTimeout(() => scheduleRetry(optimized), LOAD_TIMEOUT_MS)
    })
    const observer = getIO()
    if (observer) {
      ioCallbacks.set(el, startLoad)
      observer.observe(el)
      return () => { observer.unobserve(el); ioCallbacks.delete(el) }
    } else {
      startLoad()
    }
  }, [optimized, isPriority, activeSrc])

  if (!optimized || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt} style={style}>
        <img src={IMAGES.logo.onDark} alt="" aria-hidden="true" />
      </div>
    )
  }

  // Pas encore activée : placeholder seul (l'IO l'observe pour déclencher le chargement)
  if (!activeSrc) {
    return <div ref={placeholderRef} className={`img-placeholder ${className}`} style={style} aria-hidden="true" />
  }

  // En cours de chargement : placeholder en arrière-plan + img invisible qui charge en parallèle
  // On garde le placeholder jusqu'à onLoad pour éviter le flash de fond blanc
  if (!loaded) {
    return (
      <>
        <div className="img-placeholder" style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
        <img
          src={activeSrc}
          alt={alt}
          className={className}
          decoding="async"
          fetchPriority={isPriority ? 'high' : 'auto'}
          style={{ ...style, opacity: 0 }}
          onLoad={() => {
            clearTimers()
            releaseSlot()
            retryCount.current = 0
            setLoaded(true)
          }}
          onError={() => scheduleRetry(optimized!)}
        />
      </>
    )
  }

  // Chargée : img seule, fondu
  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={isPriority ? 'high' : 'auto'}
      style={{ ...style, opacity: 1, transition: 'opacity .2s ease' }}
    />
  )
}
