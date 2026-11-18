import type { VercelRequest, VercelResponse } from '@vercel/node'
import sharp from 'sharp'

const ALLOWED_HOST = 'kfkaejnkwcmyqeynlvme.supabase.co'
const MAX_WIDTH = 1200
const BG_THRESHOLD = 60

const LIGHT_THRESHOLD = 232

// Makes the studio background (transparent, white or black) transparent. Only pixels
// connected to the image border are removed, so the shoe itself stays opaque.
export async function cutoutBackground(input: ReturnType<typeof sharp>): Promise<Buffer> {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h
  const bg = new Uint8Array(n)
  const stack = new Int32Array(n)
  let sp = 0

  const isLight = (p: number) =>
    data[p * 4 + 3] < 16 ||
    Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) >= LIGHT_THRESHOLD
  const isDark = (p: number) => data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2] <= BG_THRESHOLD

  const flood = (match: (p: number) => boolean, seeds: number[]) => {
    const seed = (p: number) => { if (!bg[p] && match(p)) { bg[p] = 1; stack[sp++] = p } }
    seeds.forEach(seed)
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % w
      if (x > 0) seed(p - 1)
      if (x < w - 1) seed(p + 1)
      if (p >= w) seed(p - w)
      if (p < n - w) seed(p + w)
    }
  }

  const border: number[] = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1)

  flood(isLight, border)
  flood(isDark, border)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (bg[p]) { data[p * 4 + 3] = 0; continue }
      let fg = 0, total = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          total++
          if (!bg[yy * w + xx]) fg++
        }
      }
      if (fg < total) data[p * 4 + 3] = Math.round((255 * fg) / total)
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  const rawW   = Array.isArray(req.query.w)   ? req.query.w[0]   : req.query.w
  const rawBg  = Array.isArray(req.query.bg)  ? req.query.bg[0]  : req.query.bg

  if (!rawUrl) return res.status(400).end('missing url')

  let parsed: URL
  try { parsed = new URL(rawUrl) } catch { return res.status(400).end('invalid url') }

  if (parsed.hostname !== ALLOWED_HOST) return res.status(403).end('host not allowed')

  const width = Math.min(Math.max(Number(rawW) || 600, 1), MAX_WIDTH)

  const upstream = await fetch(rawUrl)
  if (!upstream.ok) return res.status(upstream.status).end()

  const buf = Buffer.from(await upstream.arrayBuffer())
  const pipeline = sharp(buf).resize({ width, withoutEnlargement: true })

  let out: Buffer
  if (rawBg === 'cut') {
    out = await cutoutBackground(pipeline)
    res.setHeader('Content-Type', 'image/webp')
  } else {
    out = await pipeline.jpeg({ quality: 82, progressive: true }).toBuffer()
    res.setHeader('Content-Type', 'image/jpeg')
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable')
  res.setHeader('Vary', 'Accept')
  res.end(out)
}
