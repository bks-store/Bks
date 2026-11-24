declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    fbq: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }
    _fbq: Window['fbq']
  }
}

export const CONSENT_KEY = 'bks-cookie-consent'

// G-MVLSPMLB9G était chargé en dur dans index.html : on le garde pour ne pas couper l'historique de cette propriété.
const GA4_IDS = [...new Set([import.meta.env.VITE_GA4_ID as string | undefined, 'G-MVLSPMLB9G'].filter(Boolean) as string[])]
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

let started = false

export function hasConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === 'accepted' } catch { return false }
}

function initGA4(ids: string[]) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ids[0]}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  // gtag.js exige l'objet arguments, pas un tableau
  window.gtag = function () { window.dataLayer.push(arguments) } as Window['gtag']
  window.gtag('js', new Date())
  for (const id of ids) window.gtag('config', id, { send_page_view: false })
}

function initMetaPixel(id: string) {
  const f = window
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

  const t = document.createElement('script')
  t.async = true
  t.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(t)
  window.fbq('init', id)
}

export function startTracking() {
  if (started || !hasConsent()) return false
  started = true
  if (GA4_IDS.length) initGA4(GA4_IDS)
  if (PIXEL_ID) initMetaPixel(PIXEL_ID)
  return true
}

export function trackPageView(path: string) {
  if (!started) return
  window.gtag?.('event', 'page_view', { page_path: path, page_title: document.title })
  window.fbq?.('track', 'PageView')
}

export interface TrackItem { id: string; name: string; brand?: string; price: number; quantity: number; size?: string }

type EcomEvent = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase'

const GA4_NAMES: Record<EcomEvent, string> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  AddPaymentInfo: 'add_payment_info',
  Purchase: 'purchase',
}

export function trackEcom(event: EcomEvent, items: TrackItem[], value: number, eventId?: string) {
  if (!started) return
  const val = Math.round(value * 100) / 100
  window.fbq?.('track', event, {
    currency: 'EUR',
    value: val,
    content_type: 'product',
    content_ids: items.map(i => i.id),
    contents: items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  }, eventId ? { eventID: eventId } : undefined)
  window.gtag?.('event', GA4_NAMES[event], {
    currency: 'EUR',
    value: val,
    ...(event === 'Purchase' && eventId ? { transaction_id: eventId } : {}),
    items: items.map(i => ({ item_id: i.id, item_name: i.name, item_brand: i.brand, item_variant: i.size, price: i.price, quantity: i.quantity })),
  })
}
