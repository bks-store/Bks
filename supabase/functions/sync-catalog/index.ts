import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GS_API_BASE = 'https://www.goldensneakers.net/api'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
// Majoration 65% TVA incluse : PV TTC = PA * 1.65
const MARKUP = 1.65
// Max images à télécharger par sync (séquentiel pour éviter les crashes mémoire)
const MAX_IMG_DOWNLOAD = 20

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const gsToken = Deno.env.get('GOLDEN_SNEAKERS_TOKEN')
    if (!gsToken) throw new Error('GOLDEN_SNEAKERS_TOKEN manquant dans les secrets Supabase')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Catalogue GS
    const gsRes = await fetch(`${GS_API_BASE}/assortment/`, {
      headers: { Authorization: `Bearer ${gsToken}` },
    })
    if (!gsRes.ok) {
      const body = await gsRes.text()
      throw new Error(`Golden Sneakers API ${gsRes.status}: ${body}`)
    }
    const catalog: GsProduct[] = await gsRes.json()
    const now = new Date().toISOString()

    // 2. Upsert produits — sans écraser images ni is_published pour les existants
    // On sépare : insert nouveaux (avec images GS) / update existants (prix + stock seulement)
    const gsImageMap: Record<string, string[]> = {}
    const productsPayload = catalog.map((item) => {
      const minBuy = Math.min(...item.sizes.map((s) => s.offer_price))
      // Ne garder que les URLs absolues (ignorer les chemins relatifs /images/.../main/)
      const validUrl = (u: string | undefined | null) => typeof u === 'string' && u.startsWith('http')
      const gsImages = validUrl(item.image_full_url)
        ? [item.image_full_url, ...(item.additional_images ?? []).filter(validUrl).slice(0, 3)]
        : []
      gsImageMap[item.sku] = gsImages
      return {
        sku: item.sku,
        gs_product_id: item.id,
        name: item.name,
        brand: item.brand_name,
        category: 'sneakers',
        stock_type: 'dropshipping',
        price_sale: Math.ceil(minBuy * MARKUP * 100 - 1) / 100,
        price_buy: minBuy,
        last_sync_at: now,
        sync_status: 'synced',
      }
    })

    const { data: upsertedProducts, error: prodErr } = await supabase
      .from('products')
      .upsert(productsPayload, { onConflict: 'sku', ignoreDuplicates: false })
      .select('id, sku, images')

    // Pour les produits sans images encore, initialiser avec l'URL GS
    const noImg = (upsertedProducts ?? []).filter(p => !p.images?.length)
    if (noImg.length > 0) {
      await Promise.all(noImg.map(p =>
        supabase.from('products')
          .update({ images: gsImageMap[p.sku] ?? [] })
          .eq('id', p.id)
      ))
      // Mettre à jour le tableau local pour que l'étape 5 détecte correctement
      for (const p of noImg) {
        p.images = gsImageMap[p.sku] ?? []
      }
    }

    if (prodErr) throw new Error(`Upsert produits: ${prodErr.message}`)

    // 3. SKU → UUID
    const skuToId: Record<string, string> = {}
    for (const p of upsertedProducts ?? []) skuToId[p.sku] = p.id

    // 4. Tailles
    const sizesPayload: Record<string, unknown>[] = []
    for (const item of catalog) {
      const productId = skuToId[item.sku]
      if (!productId) continue
      for (const size of item.sizes) {
        sizesPayload.push({
          product_id: productId,
          gs_size_id: size.id,
          size: size.size_eu ?? size.size_us,
          size_eu: size.size_eu,
          size_us: size.size_us,
          stock_qty: size.available_quantity,
          price_buy: size.offer_price,
          barcode: size.barcode,
        })
      }
    }

    const { error: sizeErr } = await supabase
      .from('product_sizes')
      .upsert(sizesPayload, { onConflict: 'gs_size_id', ignoreDuplicates: false })

    if (sizeErr) throw new Error(`Upsert tailles: ${sizeErr.message}`)

    // 5. Télécharger les images GS → Supabase Storage
    // On interroge directement la DB pour trouver TOUS les produits avec URLs GS ou sans image
    const storageBase = `${supabaseUrl}/storage/v1/object/public/product-images`

    // Récupérer tous les produits GS (avec sku) pour trouver ceux sans Storage URL
    const { data: allGsProducts } = await supabase
      .from('products')
      .select('id, sku, images, is_published')
      .not('sku', 'is', null)

    // Nettoyer les chemins relatifs cassés (/images/{sku}/main/) → vider pour reprendre depuis GS
    const brokenPaths = (allGsProducts ?? []).filter((p: { images: string[] }) =>
      p.images?.[0]?.startsWith('/images/')
    )
    if (brokenPaths.length > 0) {
      await Promise.all(brokenPaths.map((p: { id: string }) =>
        supabase.from('products').update({ images: [] }).eq('id', p.id)
      ))
      // Mettre à jour en mémoire
      for (const p of brokenPaths as Array<{ images: string[] }>) p.images = []
    }

    const catalogBySkuUrl = new Map(catalog.map((c: GsProduct) => [c.sku, c.image_full_url]))

    const withoutStorage = (allGsProducts ?? []).filter((p: { sku: string; images: string[] }) => {
      const img = p.images?.[0] ?? ''
      if (img.includes('supabase.co')) return false  // déjà en Storage
      // Trouver une source d'image valide : URL existante OU catalogue GS
      const hasValidExisting = img.startsWith('http')
      const catalogUrl = catalogBySkuUrl.get(p.sku) ?? ''
      const hasValidCatalog = catalogUrl.startsWith('http')
      // Si aucune source valide → exclure (produit sans image, on ne peut rien faire)
      return hasValidExisting || hasValidCatalog
    })

    // Publiés en premier
    const totalNeedsImg = withoutStorage.length
    const sortedForImg = [...withoutStorage].sort((a: { is_published: boolean }, b: { is_published: boolean }) =>
      Number(b.is_published) - Number(a.is_published)
    )
    const needsImg = sortedForImg.slice(0, MAX_IMG_DOWNLOAD)

    let imagesDownloaded = 0

    const errors: string[] = []

    const validUrl = (u: string | undefined | null) => typeof u === 'string' && u.startsWith('http')

    // Téléchargement séquentiel pour éviter les crashes mémoire (images ~3MB chacune)
    for (const product of needsImg as Array<{ id: string; sku: string; images: string[] }>) {
      const item = catalog.find(c => c.sku === product.sku)

      // URL à télécharger : depuis le catalogue GS, ou depuis l'URL déjà en DB (produit discontinué)
      const imageUrl = validUrl(item?.image_full_url)
        ? item!.image_full_url
        : validUrl(product.images?.[0]) ? product.images[0] : null

      if (!imageUrl) { errors.push(`no valid url: ${product.sku}`); continue }

      try {
        const res = await fetch(imageUrl)
        if (!res.ok) { errors.push(`fetch ${res.status}: ${product.sku}`); continue }
        const buf = await res.arrayBuffer()
        const path = `gs/${product.sku}/0.jpg`

        const { error: upErr } = await supabase.storage
          .from('product-images')
          .upload(path, buf, { upsert: true, contentType: 'image/jpeg' })

        if (upErr) { errors.push(`upload: ${product.sku}: ${upErr.message}`); continue }

        const additional = item?.additional_images?.filter(validUrl).slice(0, 3) ?? []
        const newImages = [`${storageBase}/${path}`, ...additional]
        await supabase.from('products').update({ images: newImages }).eq('id', product.id)
        imagesDownloaded++
      } catch (e) {
        errors.push(`exception: ${product.sku}: ${(e as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        products_synced: catalog.length,
        sizes_synced: sizesPayload.length,
        images_cached: imagesDownloaded,
        images_pending: Math.max(0, totalNeedsImg - imagesDownloaded),
        errors,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})

interface GsSize {
  id: number
  barcode: string
  size_us: string
  size_eu: string
  offer_price: number
  presented_price: number
  available_quantity: number
}

interface GsProduct {
  id: number
  sku: string
  name: string
  brand_name: string
  image_full_url: string
  additional_images: string[]
  sizes: GsSize[]
}
