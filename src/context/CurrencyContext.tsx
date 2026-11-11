import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Pays → devise (tout ce qui n'est pas listé → EUR)
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: 'GBP',
  CH: 'CHF',
  SE: 'SEK',
  DK: 'DKK',
  NO: 'NOK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  IS: 'ISK',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  SEK: 'kr',
  DKK: 'kr',
  NOK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  ISK: 'kr',
}

function detectCurrency(): string {
  const lang = navigator.language || 'fr-FR'
  const country = lang.split('-')[1]?.toUpperCase() ?? ''
  return COUNTRY_TO_CURRENCY[country] ?? 'EUR'
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(navigator.language || 'fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'HUF' || currency === 'ISK' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${CURRENCY_SYMBOLS[currency] ?? currency} ${amount.toFixed(2)}`
  }
}

interface CurrencyContextType {
  currency: string
  rate: number
  isEuro: boolean
  formatPrice: (eurAmount: number) => string
  formatEur: (eurAmount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  rate: 1,
  isEuro: true,
  formatPrice: (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  formatEur:   (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
})

const CACHE_KEY = 'bks_fx_rates'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

// Taux de secours si l'API est indisponible (mis à jour manuellement si besoin)
const FALLBACK_RATES: Record<string, number> = {
  GBP: 0.84, CHF: 0.94, SEK: 11.5, DKK: 7.46, NOK: 11.8,
  PLN: 4.27, CZK: 25.2, HUF: 405, RON: 4.97, ISK: 150,
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency] = useState<string>(detectCurrency)
  const [rate, setRate] = useState(() => FALLBACK_RATES[detectCurrency()] ?? 1)

  useEffect(() => {
    if (currency === 'EUR') return

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { ts, rates } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL && rates[currency]) {
          setRate(rates[currency])
          return
        }
      }
    } catch { /* ignore */ }

    // Fetch from frankfurter.app (ECB rates, free, no key)
    fetch(`https://api.frankfurter.app/latest?from=EUR&to=${Object.keys(COUNTRY_TO_CURRENCY).map(c => COUNTRY_TO_CURRENCY[c]).join(',')}`)
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: data.rates }))
          } catch { /* ignore */ }
          if (data.rates[currency]) setRate(data.rates[currency])
        }
      })
      .catch(() => { /* fallback: taux hardcodés déjà initialisés */ })
  }, [currency])

  const formatEur = (eurAmount: number) =>
    eurAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const formatPrice = (eurAmount: number) =>
    currency === 'EUR'
      ? formatEur(eurAmount)
      : formatAmount(eurAmount * rate, currency)

  return (
    <CurrencyContext.Provider value={{ currency, rate, isEuro: currency === 'EUR', formatPrice, formatEur }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
