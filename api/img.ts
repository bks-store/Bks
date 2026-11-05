import type { VercelRequest, VercelResponse } from '@vercel/node'
import sharp from 'sharp'

const ALLOWED_HOST = 'kfkaejnkwcmyqeynlvme.supabase.co'
const MAX_WIDTH = 1200

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  const rawW   = Array.isArray(req.query.w)   ? req.query.w[0]   : req.query.w

  if (!rawUrl) return res.status(400).end('missing url')

  let parsed: URL
  try { parsed = new URL(rawUrl) } catch { return res.status(400).end('invalid url') }

  if (parsed.hostname !== ALLOWED_HOST) return res.status(403).end('host not allowed')

  const width = Math.min(Math.max(Number(rawW) || 600, 1), MAX_WIDTH)

  const upstream = await fetch(rawUrl)
  if (!upstream.ok) return res.status(upstream.status).end()

  const buf = Buffer.from(await upstream.arrayBuffer())

  const resized = await sharp(buf)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer()

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable')
  res.setHeader('Vary', 'Accept')
  res.end(resized)
}
