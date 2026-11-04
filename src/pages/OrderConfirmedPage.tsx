import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowRight, UserPlus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUserAuth } from '../context/UserAuthContext'
import { useTranslation } from '../i18n/useTranslation'

export default function OrderConfirmedPage() {
  const [params] = useSearchParams()
  const orderId = params.get('order')
  const redirectStatus = params.get('redirect_status')
  const { clearCart } = useCart()
  const { user } = useUserAuth()
  const { t } = useTranslation()
  const o = t.orderConfirmed
  const [cleared, setCleared] = useState(false)

  const success = !redirectStatus || redirectStatus === 'succeeded'

  useEffect(() => {
    if (success && !cleared) {
      clearCart()
      setCleared(true)
    }
  }, [success, clearCart, cleared])

  if (!redirectStatus) {
    return (
      <div className="container">
        <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
          <Loader2 size={40} strokeWidth={1.4} className="animate-spin" style={{ marginBottom: '1.5rem', color: 'var(--ink-soft)' }} />
          <p className="lead">{o.loading}</p>
        </div>
      </div>
    )
  }

  if (!success) {
    return (
      <div className="container">
        <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
          <XCircle size={56} strokeWidth={1.2} style={{ marginBottom: '1.5rem', color: '#dc2626' }} />
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>{o.failedEyebrow}</p>
          <h1 className="display h-lg" style={{ marginBottom: '1.25rem' }}>
            {redirectStatus === 'canceled' ? o.cancelled : o.failed}
          </h1>
          <p className="lead" style={{ marginBottom: '2.5rem', maxWidth: '36rem', textAlign: 'center' }}>
            {o.failedText}
          </p>
          <Link to="/panier" className="btn btn--solid">
            {o.retry} <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
        <CheckCircle size={56} strokeWidth={1.2} color="var(--bks-brun)" style={{ marginBottom: '1.5rem' }} />
        <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>{o.successEyebrow}</p>
        <h1 className="display h-lg" style={{ marginBottom: '1.25rem' }}>{o.successTitle}</h1>
        <p className="lead" style={{ marginBottom: '0.75rem', maxWidth: '36rem', textAlign: 'center' }}>
          {o.successText}
        </p>
        {orderId && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginBottom: '2.5rem' }}>
            {o.ref} <code style={{ fontFamily: 'monospace' }}>{orderId}</code>
          </p>
        )}
        <Link to="/catalogue" className="btn btn--solid">
          {o.continueShopping} <ArrowRight size={16} strokeWidth={1.5} />
        </Link>

        {!user && (
          <div style={{
            marginTop: '2.5rem',
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--line)',
            borderRadius: 8,
            maxWidth: '26rem',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <UserPlus size={18} strokeWidth={1.5} color="var(--accent)" />
              <strong style={{ fontSize: '0.9375rem' }}>{o.createAccountTitle}</strong>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {o.createAccountText}
            </p>
            <Link
              to="/inscription"
              className="btn btn--outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              {o.createAccount} <ArrowRight size={14} strokeWidth={1.6} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
