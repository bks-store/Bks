import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const SUPPORTED_CURRENCIES = ['EUR', 'GBP', 'CHF', 'USD', 'CAD'] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', GBP: '£', CHF: 'CHF', USD: '$', CAD: 'CA$',
}

const FALLBACK_RATES: Record<string, number> = {
  GBP: 0.84, CHF: 0.95, USD: 1.08, CAD: 1.47,
}

const MANUAL_KEY = 'bks-currency-manual'

function formatAmount(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${CURRENCY_SYMBOLS[currency] ?? currency} ${amount.toFixed(2)}`
  }
}

interface CurrencyContextType {
  currency: string
  rate: number
  isEuro: boolean
  loading: boolean
  formatPrice: (eurAmount: number) => string
  formatEur: (eurAmount: number) => string
  setManualCurrency: (currency: SupportedCurrency | null) => void
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  rate: 1,
  isEuro: true,
  loading: false,
  formatPrice: (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  formatEur:   (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  setManualCurrency: () => {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<string>('EUR')
  const [rate, setRate] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Choix manuel sauvegardé → on l'applique directement sans appel API
    try {
      const saved = localStorage.getItem(MANUAL_KEY) as SupportedCurrency | null
      if (saved && SUPPORTED_CURRENCIES.includes(saved)) {
        setCurrency(saved)
        setRate(FALLBACK_RATES[saved] ?? 1)
        // On récupère quand même les taux à jour en arrière-plan
        fetch('/api/currency')
          .then(r => r.json())
          .then((data: { rates: Record<string, number> }) => {
            if (data?.rates?.[saved]) setRate(data.rates[saved])
          })
          .catch(() => {})
        setLoading(false)
        return
      }
    } catch { /* ignore */ }

    // Détection par IP via l'API serverless
    fetch('/api/currency')
      .then(r => r.json())
      .then((data: { currency: string; rate: number }) => {
        if (data?.currency && data?.rate) {
          setCurrency(data.currency)
          setRate(data.rate)
        }
      })
      .catch(() => {
        // Fallback : EUR sans taux (rate = 1)
      })
      .finally(() => setLoading(false))
  }, [])

  const setManualCurrency = (c: SupportedCurrency | null) => {
    try {
      if (c === null) {
        localStorage.removeItem(MANUAL_KEY)
      } else {
        localStorage.setItem(MANUAL_KEY, c)
      }
    } catch { /* ignore */ }

    if (c === null) {
      // Réinitialiser à EUR + relancer détection IP
      setCurrency('EUR')
      setRate(1)
      setLoading(true)
      fetch('/api/currency')
        .then(r => r.json())
        .then((data: { currency: string; rate: number }) => {
          if (data?.currency && data?.rate) {
            setCurrency(data.currency)
            setRate(data.rate)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setCurrency(c)
      setRate(FALLBACK_RATES[c] ?? 1)
      fetch('/api/currency')
        .then(r => r.json())
        .then((data: { rates: Record<string, number> }) => {
          if (data?.rates?.[c]) setRate(data.rates[c])
        })
        .catch(() => {})
    }
  }

  const locale = typeof navigator !== 'undefined' ? (navigator.language || 'fr-FR') : 'fr-FR'

  const formatEur = (eurAmount: number) =>
    eurAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const formatPrice = (eurAmount: number) =>
    currency === 'EUR'
      ? formatEur(eurAmount)
      : formatAmount(eurAmount * rate, currency, locale)

  return (
    <CurrencyContext.Provider value={{ currency, rate, isEuro: currency === 'EUR', loading, formatPrice, formatEur, setManualCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
