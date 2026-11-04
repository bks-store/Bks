import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'bks-cookie-consent'

type ConsentState = 'accepted' | 'declined' | null

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ConsentState
      if (stored === 'accepted' || stored === 'declined') {
        setConsent(stored)
      } else {
        // Show banner after a short delay (less intrusive)
        const t = setTimeout(() => setVisible(true), 1200)
        return () => clearTimeout(t)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch {}
    setConsent('accepted')
    setVisible(false)
  }

  const decline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined') } catch {}
    setConsent('declined')
    setVisible(false)
  }

  if (consent !== null || !visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Gestion des cookies" aria-live="polite">
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <p>
            <strong>Cookies</strong> — Ce site utilise des cookies techniques indispensables à son fonctionnement.
            Avec votre accord, nous utilisons également Google Analytics pour mesurer l'audience (données anonymisées).{' '}
            <Link to="/confidentialite">En savoir plus</Link>
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button className="btn btn--solid btn--sm" onClick={accept}>
            Accepter
          </button>
          <button className="btn btn--outline btn--sm" onClick={decline}>
            Refuser
          </button>
        </div>
      </div>
    </div>
  )
}

export function useCookieConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY) as ConsentState
  } catch {
    return null
  }
}
