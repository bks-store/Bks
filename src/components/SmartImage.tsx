import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { IMAGES } from '../config/images'

// ── Semaphore: max 4 concurrent image loads ──────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────

// Adds Supabase image transform params to reduce egress bandwidth
function optimizeUrl(src: string, width: number): string {
  if (!src.includes('supabase.co/storage')) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}width=${width}&quality=75&format=webp`
}

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
  const [failed, setFailed] = useState(false)
  const placeholderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!optimized || isPriority || activeSrc) return
    const el = placeholderRef.current
    if (!el) return

    const startLoad = () => acquireSlot(() => setActiveSrc(optimized))
    const observer = getIO()
    if (observer) {
      ioCallbacks.set(el, startLoad)
      observer.observe(el)
      return () => { observer.unobserve(el); ioCallbacks.delete(el) }
    } else {
      // SSR / no IO: load immediately
      startLoad()
    }
  }, [src, isPriority, activeSrc])

  if (!optimized || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt} style={style}>
        <img src={IMAGES.logo.onDark} alt="" aria-hidden="true" />
      </div>
    )
  }

  if (!activeSrc) {
    return <div ref={placeholderRef} className={`img-placeholder ${className}`} style={style} aria-hidden="true" />
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority={isPriority ? 'high' : 'auto'}
      style={style}
      onLoad={releaseSlot}
      onError={() => { releaseSlot(); setFailed(true) }}
    />
  )
}
