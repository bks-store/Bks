import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SITE = 'https://bks-store.com'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/catalogue', priority: '0.9', changefreq: 'daily' },
  { loc: '/a-propos', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/livraison', priority: '0.4', changefreq: 'monthly' },
]

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  )

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, updated_at')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(2000)

  const now = new Date().toISOString().split('T')[0]

  const staticEntries = STATIC_URLS.map(u => `
  <url>
    <loc>${SITE}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${now}</lastmod>
  </url>`).join('')

  const productEntries = (products ?? []).map((p: any) => {
    const slug = p.slug ?? p.id
    const lastmod = p.updated_at ? p.updated_at.split('T')[0] : now
    return `
  <url>
    <loc>${SITE}/produit/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticEntries}
  ${productEntries}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(xml)
}
