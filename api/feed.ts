import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SITE = 'https://bks-store.com'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  )

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, brand, price_sale, images, description, category')
    .eq('is_published', true)
    .not('images', 'eq', '{}')
    .order('created_at', { ascending: false })
    .limit(1000)

  const items = (products ?? []).map((p: any) => {
    const title = p.name.toLowerCase().startsWith(p.brand.toLowerCase())
      ? p.name : `${p.brand} ${p.name}`
    const url = `${SITE}/produit/${p.slug ?? p.id}`
    const image = p.images?.[0] ?? ''
    const price = Number(p.price_sale).toFixed(2)
    const desc = p.description || `${title} disponible chez BKS Dinan. Livraison DHL France & Europe.`

    return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${title}]]></g:title>
      <g:description><![CDATA[${desc}]]></g:description>
      <g:link>${url}</g:link>
      ${image ? `<g:image_link>${image}</g:image_link>` : ''}
      <g:price>${price} EUR</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand><![CDATA[${p.brand}]]></g:brand>
      <g:google_product_category>187</g:google_product_category>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BKS — Sneakers &amp; Streetwear à Dinan</title>
    <link>${SITE}</link>
    <description>Boutique sneakers BKS à Dinan — Jordan, Nike, Adidas, New Balance</description>
    ${items}
  </channel>
</rss>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(xml)
}
