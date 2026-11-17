import type { VercelRequest, VercelResponse } from '@vercel/node'

// Country code → currency (tout ce qui n'est pas listé → EUR)
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: 'GBP',
  CH: 'CHF',
  US: 'USD',
  CA: 'CAD',
}

const FALLBACK_RATES: Record<string, number> = {
  GBP: 0.84,
  CHF: 0.95,
  USD: 1.08,
  CAD: 1.47,
}

// Cache module-level (partagé entre les requêtes sur la même instance Vercel)
let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null
const CACHE_TTL = 6 * 3600 * 1000 // 6h

async function getLatestRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL) {
    return ratesCache.rates
  }
  try {
    const r = await fetch(
      'https://api.frankfurter.app/latest?base=EUR&symbols=GBP,CHF,USD,CAD',
      { signal: AbortSignal.timeout(3000) },
    )
    if (!r.ok) throw new Error('frankfurter error')
    const data = await r.json()
    ratesCache = { rates: data.rates as Record<string, number>, fetchedAt: Date.now() }
    return ratesCache.rates
  } catch {
    return FALLBACK_RATES
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Bots (Googlebot, etc.) → EUR pour correspondre aux prix du feed Merchant Center
  const ua = (req.headers['user-agent'] ?? '').toLowerCase()
  const isBot = /googlebot|adsbot|bingbot|crawler|spider|prerender|headlesschrome/i.test(ua)

  const rawCountry = req.headers['x-vercel-ip-country'] as string | undefined
  const countryCode = isBot ? 'FR' : (rawCountry?.toUpperCase() ?? 'FR')

  const currency = COUNTRY_TO_CURRENCY[countryCode] ?? 'EUR'
  const rates = await getLatestRates()
  const rate = currency === 'EUR' ? 1 : (rates[currency] ?? FALLBACK_RATES[currency] ?? 1)

  res.setHeader('Cache-Control', 'private, max-age=0, no-store')
  res.status(200).json({ currency, rate, countryCode, rates })
}
