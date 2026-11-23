import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

const COOKIE_KEY = 'bks_bf_popup_v1'
const DELAY_MS   = 3000

export default function BlackFridayPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_KEY)) return
    } catch {}
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('bks:open-bf-popup', handler)
    return () => window.removeEventListener('bks:open-bf-popup', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(COOKIE_KEY, '1') } catch {}
  }

  if (!visible) return null

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(10,5,2,0.6)',
          backdropFilter: 'blur(3px)', zIndex: 9000,
          animation: 'fade-in 0.25s ease',
        }}
      />

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', pointerEvents: 'none',
      }}>
        <div style={{
          background: '#fff', borderRadius: 6, overflow: 'hidden',
          width: '100%', maxWidth: 420,
          pointerEvents: 'auto',
          boxShadow: '0 32px 64px -16px rgba(10,5,2,0.5)',
          animation: 'slide-up 0.3s var(--ease, cubic-bezier(0.22,1,0.36,1))',
        }}>

          {/* Header */}
          <div style={{ background: '#0E0906', padding: '32px 32px 24px', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(244,239,230,0.4)', padding: 4, lineHeight: 1,
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <p style={{ color: 'rgba(200,149,90,0.6)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'var(--ff-body, sans-serif)', fontWeight: 600 }}>
              — Offre exclusive —
            </p>
            <p style={{ color: '#F4EFE6', fontSize: 56, fontWeight: 400, margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
              −20%
            </p>
            <p style={{ color: '#C8955A', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', margin: '10px 0 4px', fontFamily: 'var(--ff-body, sans-serif)', fontWeight: 600 }}>
              Black Friday
            </p>
            <p style={{ color: 'rgba(244,239,230,0.3)', fontSize: 11, margin: 0, fontFamily: 'var(--ff-body, sans-serif)' }}>
              sur toute la boutique · jusqu'au 29 nov.
            </p>
          </div>

          {/* Code */}
          <div style={{ padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6D5747', margin: '0 0 20px', lineHeight: 1.6, fontFamily: 'var(--ff-body, sans-serif)' }}>
              Utilisez ce code dans votre panier pour profiter de l'offre.
            </p>

            <div style={{ background: '#FBF8F3', borderTop: '3px solid #C8955A', padding: '20px 24px', marginBottom: '20px' }}>
              <p style={{ fontSize: 9, color: '#9E8E84', textTransform: 'uppercase', letterSpacing: '0.22em', margin: '0 0 8px', fontFamily: 'var(--ff-body, sans-serif)', fontWeight: 600 }}>
                Votre code promo
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#28170E', letterSpacing: '0.14em', margin: '0 0 6px', fontFamily: 'var(--ff-body, sans-serif)' }}>
                BFBKS
              </p>
              <p style={{ fontSize: 11, color: '#C8955A', margin: 0, fontFamily: 'var(--ff-body, sans-serif)' }}>
                −20% sur tout · à saisir dans le panier
              </p>
            </div>

            <Link
              to="/catalogue"
              onClick={dismiss}
              style={{
                display: 'block', background: '#28170E', color: '#F4EFE6',
                textDecoration: 'none', padding: '0.8rem 1.5rem',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                fontFamily: 'var(--ff-body, sans-serif)',
              }}
            >
              Explorer la boutique →
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
