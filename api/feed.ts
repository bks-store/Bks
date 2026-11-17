import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SITE = 'https://www.bks-store.com'

// Map category → Google Product Category ID
const CATEGORY_MAP: Record<string, string> = {
  sneakers: '187',       // Apparel & Accessories > Shoes
  streetwear: '1604',    // Apparel & Accessories > Clothing
  accessoires: '188',    // Apparel & Accessories > Jewelry (closest for accessories)
}

// Derive gender hint from product name/tags (conservative — only if clear signal)
function guessGender(name: string, tags: string[]): string | null {
  const all = (name + ' ' + tags.join(' ')).toLowerCase()
  if (/\bfemme\b|\bwoman\b|\bwomen\b|\bw$|\bwmns\b/.test(all)) return 'female'
  if (/\bhomme\b|\bman\b|\bmen\b|\bm$|\bmns\b/.test(all)) return 'male'
  return null
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  )

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, slug, name, brand, sku, price_sale, price_original, images,
      description, category, subcategory, tags, is_published,
      product_sizes (size_eu, size_us, available, barcode, stock_qty)
    `)
    .eq('is_published', true)
    .not('images', 'eq', '{}')
    .order('created_at', { ascending: false })
    .limit(1000)

  const entries: string[] = []

  for (const p of (products ?? []) as any[]) {
    // Skip if product has no slug (URL would use UUID = poor UX / rejected by Google)
    if (!p.slug) continue

    const title = p.name.toLowerCase().startsWith((p.brand ?? '').toLowerCase())
      ? p.name : `${p.brand} ${p.name}`

    const url = `${SITE}/produit/${p.slug}`
    const price = Number(p.price_sale).toFixed(2)
    const originalPrice = p.price_original && Number(p.price_original) > Number(p.price_sale)
      ? Number(p.price_original).toFixed(2) : null

    const desc = p.description
      || `${title} — Boutique BKS à Dinan. Sneakers & streetwear, livraison DHL en France et en Europe sous 5 à 8 jours ouvrés.`

    const catId = CATEGORY_MAP[p.category] ?? '187'
    const productType = p.category === 'sneakers' ? 'Sneakers' : p.category === 'streetwear' ? 'Streetwear' : 'Accessoires'
    const gender = guessGender(p.name, p.tags ?? [])

    const images: string[] = p.images ?? []
    const mainImage = images[0]
    if (!mainImage) continue

    const sizes: any[] = p.product_sizes ?? []
    // Check if at least one size is available
    const hasStock = sizes.some((s: any) => s.available && (s.stock_qty ?? 0) > 0)
    const availability = hasStock ? 'in stock' : 'out of stock'

    if (sizes.length === 0) {
      // No size variants — emit single entry
      entries.push(buildItem({
        id: p.id,
        title,
        desc,
        url,
        mainImage,
        extraImages: images.slice(1, 10),
        price,
        originalPrice,
        availability,
        brand: p.brand,
        sku: p.sku,
        catId,
        productType,
        gender,
        size: null,
        barcode: null,
        itemGroupId: null,
      }))
    } else {
      // Emit one entry per size variant
      for (const s of sizes) {
        const sizeAvail = s.available && (s.stock_qty ?? 0) > 0 ? 'in stock' : 'out of stock'
        const sizeLabel = s.size_eu ?? s.size_us ?? null
        entries.push(buildItem({
          id: `${p.id}_${(sizeLabel ?? 'ns').toString().replace(/[^a-zA-Z0-9]/g, '')}`,
          title: sizeLabel ? `${title} — EU ${sizeLabel}` : title,
          desc,
          url,
          mainImage,
          extraImages: images.slice(1, 10),
          price,
          originalPrice,
          availability: sizeAvail,
          brand: p.brand,
          sku: p.sku ? `${p.sku}-${sizeLabel ?? 'ns'}` : null,
          catId,
          productType,
          gender,
          size: sizeLabel ? String(sizeLabel) : null,
          barcode: s.barcode ?? null,
          itemGroupId: p.id,
        }))
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BKS — Sneakers &amp; Streetwear à Dinan</title>
    <link>${SITE}</link>
    <description>Boutique sneakers BKS à Dinan — Jordan, Nike, Adidas, New Balance. Livraison France &amp; Europe.</description>
    ${entries.join('\n')}
  </channel>
</rss>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(xml)
}

interface ItemParams {
  id: string
  title: string
  desc: string
  url: string
  mainImage: string
  extraImages: string[]
  price: string
  originalPrice: string | null
  availability: string
  brand: string
  sku: string | null
  catId: string
  productType: string
  gender: string | null
  size: string | null
  barcode: string | null
  itemGroupId: string | null
}

function buildItem(p: ItemParams): string {
  const lines = [
    `    <item>`,
    `      <g:id>${escXml(p.id)}</g:id>`,
    `      <g:title><![CDATA[${p.title}]]></g:title>`,
    `      <g:description><![CDATA[${p.desc}]]></g:description>`,
    `      <g:link>${escXml(p.url)}</g:link>`,
    `      <g:image_link>${escXml(p.mainImage)}</g:image_link>`,
    ...p.extraImages.map(img => `      <g:additional_image_link>${escXml(img)}</g:additional_image_link>`),
    p.originalPrice
      ? `      <g:price>${p.originalPrice} EUR</g:price>`
      : `      <g:price>${p.price} EUR</g:price>`,
    p.originalPrice ? `      <g:sale_price>${p.price} EUR</g:sale_price>` : '',
    `      <g:availability>${p.availability}</g:availability>`,
    `      <g:condition>new</g:condition>`,
    `      <g:brand><![CDATA[${p.brand}]]></g:brand>`,
    `      <g:google_product_category>${p.catId}</g:google_product_category>`,
    `      <g:product_type><![CDATA[${p.productType}]]></g:product_type>`,
    p.sku ? `      <g:mpn>${escXml(p.sku)}</g:mpn>` : '',
    p.barcode && isValidGtin(p.barcode) ? `      <g:gtin>${escXml(p.barcode)}</g:gtin>` : '',
    p.itemGroupId ? `      <g:item_group_id>${escXml(p.itemGroupId)}</g:item_group_id>` : '',
    p.size ? `      <g:size>${escXml(p.size)}</g:size>` : '',
    p.gender ? `      <g:gender>${p.gender}</g:gender>` : '',
    `      <g:age_group>adult</g:age_group>`,
    `      <g:shipping>`,
    `        <g:country>FR</g:country>`,
    `        <g:service>DHL Standard</g:service>`,
    `        <g:price>5.90 EUR</g:price>`,
    `      </g:shipping>`,
    `    </item>`,
  ]
  // Remove empty strings from optional lines
  return lines.filter(l => l !== '').join('\n')
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Basic GTIN validation: 8, 12, 13 or 14 digits
function isValidGtin(v: string): boolean {
  return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(v.trim())
}
