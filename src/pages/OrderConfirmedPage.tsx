import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowRight, UserPlus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUserAuth } from '../context/UserAuthContext'

export default function OrderConfirmedPage() {
  const [params] = useSearchParams()
  const orderId = params.get('order')
  const redirectStatus = params.get('redirect_status') // 'succeeded' | 'failed' | 'canceled'
  const { clearCart } = useCart()
  const { user } = useUserAuth()
  const [cleared, setCleared] = useState(false)

  const success = !redirectStatus || redirectStatus === 'succeeded'

  useEffect(() => {
    if (success && !cleared) {
      clearCart()
      setCleared(true)
    }
  }, [success, clearCart, cleared])

  if (!redirectStatus) {
    // Accès direct sans redirect Stripe — afficher un loader bref
    return (
      <div className="container">
        <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
          <Loader2 size={40} strokeWidth={1.4} className="animate-spin" style={{ marginBottom: '1.5rem', color: 'var(--ink-soft)' }} />
          <p className="lead">Vérification du paiement…</p>
        </div>
      </div>
    )
  }

  if (!success) {
    return (
      <div className="container">
        <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
          <XCircle size={56} strokeWidth={1.2} style={{ marginBottom: '1.5rem', color: '#dc2626' }} />
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Paiement non abouti</p>
          <h1 className="display h-lg" style={{ marginBottom: '1.25rem' }}>
            {redirectStatus === 'canceled' ? 'Paiement annulé' : 'Paiement échoué'}
          </h1>
          <p className="lead" style={{ marginBottom: '2.5rem', maxWidth: '36rem', textAlign: 'center' }}>
            Votre commande n'a pas été débitée. Vous pouvez réessayer ou nous contacter.
          </p>
          <Link to="/panier" className="btn btn--solid">
            Réessayer <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
        <CheckCircle size={56} strokeWidth={1.2} color="var(--bks-brun)" style={{ marginBottom: '1.5rem' }} />
        <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Merci pour votre commande</p>
        <h1 className="display h-lg" style={{ marginBottom: '1.25rem' }}>Commande confirmée</h1>
        <p className="lead" style={{ marginBottom: '0.75rem', maxWidth: '36rem', textAlign: 'center' }}>
          Votre paiement a bien été accepté. Vous recevrez un email de confirmation sous quelques minutes.
        </p>
        {orderId && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginBottom: '2.5rem' }}>
            Référence&nbsp;: <code style={{ fontFamily: 'monospace' }}>{orderId}</code>
          </p>
        )}
        <Link to="/catalogue" className="btn btn--solid">
          Continuer mes achats <ArrowRight size={16} strokeWidth={1.5} />
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
              <strong style={{ fontSize: '0.9375rem' }}>Créer un compte BKS</strong>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Suivez vos commandes, sauvegardez votre adresse et accédez à votre historique d'achats.
            </p>
            <Link
              to="/inscription"
              className="btn btn--outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              Créer mon compte <ArrowRight size={14} strokeWidth={1.6} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
