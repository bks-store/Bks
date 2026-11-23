import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const COOKIE_KEY = 'bks_bf_popup_v1'
const DELAY_MS   = 3000

export default function BlackFridayPopup() {
  const [visible, setVisible]   = useState(false)
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    // Ne pas afficher si déjà vu dans les 30 jours
    try {
      if (localStorage.getItem(COOKIE_KEY)) return
    } catch {}
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(COOKIE_KEY, '1') } catch {}
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Adresse email invalide.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: fnErr } = await supabase!.functions.invoke('send-black-friday-email', {
        body: { email: trimmed },
      })
      if (fnErr) throw new Error(fnErr.message)
      setSent(true)
      try { localStorage.setItem(COOKIE_KEY, '1') } catch {}
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(10,5,2,0.6)',
          backdropFilter: 'blur(3px)', zIndex: 9000,
          animation: 'fade-in 0.25s ease',
        }}
      />

      {/* Popup */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: '#fff', borderRadius: 6, overflow: 'hidden',
          width: '100%', maxWidth: 480,
          pointerEvents: 'auto',
          boxShadow: '0 32px 64px -16px rgba(10,5,2,0.5)',
          animation: 'slide-up 0.3s var(--ease, cubic-bezier(0.22,1,0.36,1))',
        }}>

          {/* Bandeau brun foncé */}
          <div style={{ background: '#1a0f09', padding: '28px 32px', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(244,239,230,0.5)', padding: 4, lineHeight: 1,
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <p style={{ color: '#C8955A', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 8px', fontFamily: 'var(--ff-body, sans-serif)', fontWeight: 600 }}>
              Black Friday
            </p>
            <p style={{ color: '#F4EFE6', fontSize: 48, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
              −20%
            </p>
            <p style={{ color: 'rgba(244,239,230,0.6)', fontSize: 12, margin: '8px 0 0', fontFamily: 'var(--ff-body, sans-serif)', letterSpacing: '0.08em' }}>
              sur toute la boutique · jusqu'au 29 nov.
            </p>
          </div>

          {/* Corps */}
          <div style={{ padding: '28px 32px' }}>
            {!sent ? (
              <>
                <p style={{ fontSize: 15, color: '#28170E', margin: '0 0 6px', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
                  Recevez votre code exclusif
                </p>
                <p style={{ fontSize: 12, color: '#6D5747', margin: '0 0 20px', lineHeight: 1.6, fontFamily: 'var(--ff-body, sans-serif)' }}>
                  Entrez votre email, le code vous est envoyé immédiatement.
                </p>

                <form onSubmit={submit}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null) }}
                      placeholder="votre@email.com"
                      required
                      style={{
                        flex: 1, padding: '0.65rem 0.875rem',
                        border: error ? '1px solid #dc2626' : '1px solid #DDD5CB',
                        borderRadius: 4, fontSize: 13,
                        fontFamily: 'var(--ff-body, sans-serif)',
                        color: '#28170E', background: '#fff', outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: '#28170E', color: '#F4EFE6',
                        border: 'none', borderRadius: 4,
                        padding: '0.65rem 1.125rem',
                        fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        fontFamily: 'var(--ff-body, sans-serif)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {loading ? '…' : 'Obtenir →'}
                    </button>
                  </div>

                  {error && (
                    <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 0.5rem', fontFamily: 'var(--ff-body, sans-serif)' }}>{error}</p>
                  )}

                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <p style={{ fontSize: 20, color: '#28170E', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
                  Code envoyé !
                </p>
                <p style={{ fontSize: 13, color: '#6D5747', margin: '0 0 16px', lineHeight: 1.6, fontFamily: 'var(--ff-body, sans-serif)' }}>
                  Vérifiez votre boîte mail (et vos spams).<br />
                  Votre code <strong style={{ color: '#28170E' }}>BFBKS</strong> vous y attend.
                </p>
                <button
                  onClick={dismiss}
                  style={{
                    background: '#28170E', color: '#F4EFE6',
                    border: 'none', borderRadius: 4,
                    padding: '0.65rem 1.5rem',
                    fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'var(--ff-body, sans-serif)',
                  }}
                >
                  Accéder à la boutique
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
