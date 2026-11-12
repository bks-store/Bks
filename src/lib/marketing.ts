declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    fbq: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }
    _fbq: Window['fbq']
  }
}

export function initGA4(id: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function (...args) { window.dataLayer.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

export function initMetaPixel(id: string) {
  const f = window
  const b = document
  const e = 'script'
  const v = 'https://connect.facebook.net/en_US/fbevents.js'

  if (f.fbq) return
  const n: Window['fbq'] = function (...args) {
    n.callMethod ? (n.callMethod as (...a: unknown[]) => void)(...args) : n.queue!.push(args)
  }
  if (!f._fbq) f._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  f.fbq = n

  const t = b.createElement(e) as HTMLScriptElement
  t.async = true
  t.src = v
  const s = b.getElementsByTagName(e)[0]
  s.parentNode!.insertBefore(t, s)

  window.fbq('init', id)
  window.fbq('track', 'PageView')
}
