import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GS_API_BASE = 'https://www.goldensneakers.net/api'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
// Majoration 65% TVA incluse : PV TTC = PA * 1.65
const MARKUP = 1.65
// Max images à télécharger par sync (évite le timeout)
const MAX_IMG_DOWNLOAD = 25

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

    // 2. Upsert produits (avec URL GS d'abord)
    const productsPayload = catalog.map((item) => {
      const minBuy = Math.min(...item.sizes.map((s) => s.offer_price))
      const gsImages = item.image_full_url
        ? [item.image_full_url, ...(item.additional_images ?? []).slice(0, 3)]
        : []
      return {
        sku: item.sku,
        gs_product_id: item.id,
        name: item.name,
        brand: item.brand_name,
        category: 'sneakers',
        stock_type: 'dropshipping',
        price_sale: Math.ceil(minBuy * MARKUP * 100 - 1) / 100,
        price_buy: minBuy,
        images: gsImages,
        is_published: false,
        last_sync_at: now,
        sync_status: 'synced',
      }
    })

    const { data: upsertedProducts, error: prodErr } = await supabase
      .from('products')
      .upsert(productsPayload, { onConflict: 'sku', ignoreDuplicates: false })
      .select('id, sku, images')

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
    // Seulement pour les produits qui n'ont pas encore d'URL Storage
    const storageBase = `${supabaseUrl}/storage/v1/object/public/product-images`

    const needsImg = (upsertedProducts ?? []).filter(p => {
      const img = p.images?.[0] ?? ''
      return img.includes('goldensneakers') || img === ''
    }).slice(0, MAX_IMG_DOWNLOAD)

    let imagesDownloaded = 0

    await Promise.allSettled(needsImg.map(async (product) => {
      const item = catalog.find(c => skuToId[c.sku] === product.id)
      if (!item?.image_full_url) return

      try {
        const res = await fetch(item.image_full_url)
        if (!res.ok) return
        const buf = await res.arrayBuffer()
        const path = `gs/${item.sku}/0.jpg`

        const { error: upErr } = await supabase.storage
          .from('product-images')
          .upload(path, buf, { upsert: true, contentType: 'image/jpeg' })

        if (upErr) return

        // Remplacer la première image par l'URL Storage
        const newImages = [`${storageBase}/${path}`, ...(item.additional_images ?? []).slice(0, 3)]
        await supabase.from('products').update({ images: newImages }).eq('id', product.id)
        imagesDownloaded++
      } catch {
        // Image indisponible — on garde l'URL GS
      }
    }))

    return new Response(
      JSON.stringify({
        ok: true,
        products_synced: catalog.length,
        sizes_synced: sizesPayload.length,
        images_cached: imagesDownloaded,
        images_pending: Math.max(0, needsImg.length - imagesDownloaded),
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
