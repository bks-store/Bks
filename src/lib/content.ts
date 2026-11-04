// Contenu éditable depuis l'admin : rubriques, photos du site, galerie de la boutique.
// Deux modes, même API : Supabase quand il est configuré, sinon une démo
// enregistrée dans le navigateur (localStorage).
import { supabase, isConfigured } from './supabase'
import { IMAGES } from '../config/images'
import type { Product } from '../data/products'
import type { DbRubrique, RubriqueRule } from '../types/database'

export type { RubriqueRule }

export interface Rubrique {
  id: string
  slug: string
  name: string
  description: string
  coverUrl: string | null
  ruleType: RubriqueRule
  ruleValue: string
  productIds: string[]
  position: number
  isVisible: boolean
  inMenu: boolean
  onHome: boolean
}

export interface StorePhoto {
  id: string
  url: string
  caption: string
  position: number
}

export const MEDIA_SLOTS = [
  'hero', 'hero-2', 'hero-3', 'hero-4',
  'brand', 'store', 'about',
  'instagram-1', 'instagram-2', 'instagram-3', 'instagram-4', 'instagram-5', 'instagram-6',
] as const
export type MediaKey = typeof MEDIA_SLOTS[number]

export const MEDIA_DEFAULTS: Record<MediaKey, string> = {
  hero: '/images/store/selection-jordan1.jpg',
  'hero-2': '/images/store/selection-jordan4.jpg',
  'hero-3': '/images/store/selection-saucony.jpg',
  'hero-4': '/images/store/selection-ugg.jpg',
  brand: IMAGES.brand,
  store: '/images/store/boutique-interieur.webp',
  about: '/images/store/boutique-interieur.webp',
  'instagram-1': IMAGES.instagram[0],
  'instagram-2': IMAGES.instagram[1],
  'instagram-3': IMAGES.instagram[2],
  'instagram-4': IMAGES.instagram[3],
  'instagram-5': IMAGES.instagram[4],
  'instagram-6': IMAGES.instagram[5],
}

export interface SiteContent {
  rubriques: Rubrique[]
  media: Partial<Record<MediaKey, string>>
  storePhotos: StorePhoto[]
}

export const DEFAULT_RUBRIQUES: Rubrique[] = [
  { id: 'r-sneakers', slug: 'sneakers', name: 'Sneakers', description: 'Jordan, Air Max, New Balance, ASICS', coverUrl: IMAGES.categories.sneakers, ruleType: 'category', ruleValue: 'sneakers', productIds: [], position: 0, isVisible: true, inMenu: true, onHome: true },
  { id: 'r-streetwear', slug: 'streetwear', name: 'Streetwear', description: 'Vestes, sweats et pièces de caractère', coverUrl: IMAGES.categories.streetwear, ruleType: 'category', ruleValue: 'streetwear', productIds: [], position: 1, isVisible: true, inMenu: true, onHome: true },
  { id: 'r-nouveautes', slug: 'nouveautes', name: 'Nouveautés', description: 'Les derniers arrivages', coverUrl: IMAGES.categories.nouveautes, ruleType: 'new', ruleValue: '', productIds: [], position: 2, isVisible: true, inMenu: false, onHome: true },
  { id: 'r-nike', slug: 'nike', name: 'Nike', description: 'Air Force 1, Air Max, Dunk', coverUrl: IMAGES.products['air-max-90'], ruleType: 'brand', ruleValue: 'Nike', productIds: [], position: 3, isVisible: true, inMenu: true, onHome: false },
  { id: 'r-accessoires', slug: 'accessoires', name: 'Accessoires', description: 'Entretien, chaussettes et petites pièces', coverUrl: null, ruleType: 'category', ruleValue: 'accessoires', productIds: [], position: 4, isVisible: true, inMenu: true, onHome: false },
]

const DEMO_KEY = 'bks-content-v1'
const CHANGE_EVENT = 'bks-content-change'
export const isDemo = !isConfigured

// ─── Helpers ───────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    || 'rubrique'
}

export function uniqueSlug(name: string, rubriques: Rubrique[], selfId?: string): string {
  const base = slugify(name)
  const taken = new Set(rubriques.filter(r => r.id !== selfId).map(r => r.slug))
  let slug = base
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
  return slug
}

export function productsForRubrique(r: Rubrique, products: Product[]): Product[] {
  switch (r.ruleType) {
    case 'brand': return products.filter(p => p.brand.toLowerCase() === r.ruleValue.trim().toLowerCase())
    case 'category': return products.filter(p => p.category === r.ruleValue)
    case 'new': return products.filter(p => p.isNew)
    case 'manual': {
      const byId = new Map(products.map(p => [p.id, p]))
      return r.productIds.map(id => byId.get(id)).filter((p): p is Product => Boolean(p))
    }
  }
}

export function mediaUrl(content: SiteContent, key: MediaKey): string {
  return content.media[key] || MEDIA_DEFAULTS[key]
}

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT))
export function onContentChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === DEMO_KEY) cb() }
  window.addEventListener(CHANGE_EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(CHANGE_EVENT, cb); window.removeEventListener('storage', onStorage) }
}

const newId = () => crypto.randomUUID()
const sortByPosition = <T extends { position: number }>(list: T[]) => [...list].sort((a, b) => a.position - b.position)

// ─── Demo store (localStorage) ─────────────────────────

function readDemo(): SiteContent {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SiteContent
      return { rubriques: parsed.rubriques ?? DEFAULT_RUBRIQUES, media: parsed.media ?? {}, storePhotos: parsed.storePhotos ?? [] }
    }
  } catch { /* unreadable storage: fall back to defaults */ }
  return { rubriques: DEFAULT_RUBRIQUES, media: {}, storePhotos: [] }
}

function writeDemo(content: SiteContent) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(content))
  } catch {
    throw new Error("Espace de démonstration plein : retirez quelques photos. (Avec Supabase, il n'y a pas cette limite.)")
  }
  notify()
}

// ─── Supabase mapping ──────────────────────────────────

const fromDb = (r: DbRubrique): Rubrique => ({
  id: r.id, slug: r.slug, name: r.name, description: r.description ?? '', coverUrl: r.cover_url,
  ruleType: r.rule_type, ruleValue: r.rule_value ?? '', productIds: r.product_ids ?? [], position: r.position,
  isVisible: r.is_visible, inMenu: r.in_menu, onHome: r.on_home,
})
const toDb = (r: Rubrique) => ({
  slug: r.slug, name: r.name, description: r.description || null, cover_url: r.coverUrl,
  rule_type: r.ruleType, rule_value: r.ruleValue || null, product_ids: r.productIds, position: r.position,
  is_visible: r.isVisible, in_menu: r.inMenu, on_home: r.onHome,
})
const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message) }

// ─── Public API ────────────────────────────────────────

export async function loadContent(): Promise<SiteContent> {
  if (isDemo) {
    const c = readDemo()
    return { ...c, rubriques: sortByPosition(c.rubriques), storePhotos: sortByPosition(c.storePhotos) }
  }
  const [rub, med, pho] = await Promise.all([
    supabase.from('rubriques').select('*').order('position'),
    supabase.from('site_media').select('*'),
    supabase.from('store_photos').select('*').order('position'),
  ])
  fail(rub.error); fail(med.error); fail(pho.error)
  return {
    rubriques: (rub.data ?? []).map(fromDb),
    media: Object.fromEntries((med.data ?? []).map(m => [m.key, m.url])),
    storePhotos: (pho.data ?? []).map(p => ({ id: p.id, url: p.url, caption: p.caption ?? '', position: p.position })),
  }
}

export async function saveRubrique(r: Rubrique): Promise<Rubrique> {
  if (isDemo) {
    const c = readDemo()
    const exists = c.rubriques.some(x => x.id === r.id)
    const saved = exists ? r : { ...r, id: newId(), position: c.rubriques.length }
    c.rubriques = exists ? c.rubriques.map(x => (x.id === r.id ? saved : x)) : [...c.rubriques, saved]
    writeDemo(c)
    return saved
  }
  const isNew = !r.id
  const query = isNew
    ? supabase.from('rubriques').insert(toDb(r)).select().single()
    : supabase.from('rubriques').update(toDb(r)).eq('id', r.id).select().single()
  const { data, error } = await query
  fail(error)
  notify()
  return fromDb(data as DbRubrique)
}

export async function deleteRubrique(id: string): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    c.rubriques = c.rubriques.filter(r => r.id !== id)
    writeDemo(c)
    return
  }
  fail((await supabase.from('rubriques').delete().eq('id', id)).error)
  notify()
}

export async function reorderRubriques(orderedIds: string[]): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    c.rubriques = c.rubriques.map(r => ({ ...r, position: orderedIds.indexOf(r.id) }))
    writeDemo(c)
    return
  }
  const results = await Promise.all(orderedIds.map((id, position) => supabase.from('rubriques').update({ position }).eq('id', id)))
  results.forEach(r => fail(r.error))
  notify()
}

export async function setMedia(key: MediaKey, url: string | null): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    if (url) c.media[key] = url
    else delete c.media[key]
    writeDemo(c)
    return
  }
  const { error } = url
    ? await supabase.from('site_media').upsert({ key, url })
    : await supabase.from('site_media').delete().eq('key', key)
  fail(error)
  notify()
}

export async function addStorePhotos(urls: string[]): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    const start = c.storePhotos.length
    c.storePhotos = [...c.storePhotos, ...urls.map((url, i) => ({ id: newId(), url, caption: '', position: start + i }))]
    writeDemo(c)
    return
  }
  const { count } = await supabase.from('store_photos').select('id', { count: 'exact', head: true })
  fail((await supabase.from('store_photos').insert(urls.map((url, i) => ({ url, position: (count ?? 0) + i })))).error)
  notify()
}

export async function updateStorePhoto(id: string, caption: string): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    c.storePhotos = c.storePhotos.map(p => (p.id === id ? { ...p, caption } : p))
    writeDemo(c)
    return
  }
  fail((await supabase.from('store_photos').update({ caption: caption || null }).eq('id', id)).error)
  notify()
}

export async function deleteStorePhoto(id: string): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    c.storePhotos = c.storePhotos.filter(p => p.id !== id)
    writeDemo(c)
    return
  }
  fail((await supabase.from('store_photos').delete().eq('id', id)).error)
  notify()
}

export async function reorderStorePhotos(orderedIds: string[]): Promise<void> {
  if (isDemo) {
    const c = readDemo()
    c.storePhotos = c.storePhotos.map(p => ({ ...p, position: orderedIds.indexOf(p.id) }))
    writeDemo(c)
    return
  }
  const results = await Promise.all(orderedIds.map((id, position) => supabase.from('store_photos').update({ position }).eq('id', id)))
  results.forEach(r => fail(r.error))
  notify()
}

export async function resetDemoContent(): Promise<void> {
  localStorage.removeItem(DEMO_KEY)
  notify()
}

// ─── Image upload ──────────────────────────────────────

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_FILE_MB = 25

// Resize in the browser so phone photos stay light (max 2000px, JPEG).
async function compress(file: File, maxSide: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Image illisible'))), 'image/jpeg', quality))
}

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as string)
  reader.onerror = () => reject(new Error('Image illisible'))
  reader.readAsDataURL(blob)
})

export async function uploadImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('Format non pris en charge : utilisez une photo JPEG, PNG ou WebP.')
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Photo trop lourde (maximum ${MAX_FILE_MB} Mo).`)

  if (isDemo) {
    // Demo storage is small: keep previews light.
    return blobToDataUrl(await compress(file, 1400, 0.8))
  }
  const blob = await compress(file, 2000, 0.85)
  const path = `${new Date().getFullYear()}/${newId()}.jpg`
  const { error } = await supabase.storage.from('site-media').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  fail(error)
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
}
