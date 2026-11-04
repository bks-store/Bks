import { useState, useEffect, cloneElement, useCallback, Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Minus, Plus, X, ArrowRight, ChevronRight, Loader2,
  Lock, ShieldCheck,
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../i18n/useTranslation'
import { useUserAuth } from '../context/UserAuthContext'
import SmartImage from '../components/SmartImage'
import { IMAGES } from '../config/images'
import { formatPrice } from '../lib/format'
import { supabase, isConfigured } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '')

class StripeErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.08)', borderRadius: 6, fontSize: '0.875rem', color: '#dc2626' }}>
        Erreur paiement : {this.state.error}
      </div>
    )
    return this.props.children
  }
}

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#392216',
    colorBackground: '#F4EFE6',
    colorText: '#2E1B11',
    colorTextSecondary: '#6D5747',
    colorTextPlaceholder: '#9E8070',
    colorDanger: '#dc2626',
    borderRadius: '4px',
    fontFamily: '"Manrope", system-ui, sans-serif',
    fontSizeBase: '15px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(57,34,22,0.2)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #392216', boxShadow: '0 0 0 2px rgba(57,34,22,0.08)' },
    '.Tab': { border: '1px solid rgba(57,34,22,0.15)' },
    '.Tab--selected': { border: '1px solid #392216', boxShadow: '0 0 0 1px #392216' },
    '.Tab:hover': { backgroundColor: '#EBE3D6' },
  },
}

type Step = 'cart' | 'details' | 'payment'

interface Address {
  line1: string
  line2: string
  city: string
  zip: string
  country: string
}
interface CustomerForm {
  name: string
  email: string
  phone: string
  address: Address
}
const EMPTY_FORM: CustomerForm = {
  name: '',
  email: '',
  phone: '',
  address: { line1: '', line2: '', city: '', zip: '', country: 'FR' },
}

// ── Stripe payment form (needs Elements context) ──────────────────────────────
function StripePaymentForm({
  orderId,
  total,
  onBack,
}: {
  orderId: string
  total: number
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setPaying(true)
    setError(null)

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande-confirmee?order=${orderId}`,
      },
    })

    // confirmPayment redirige en cas de succès — on arrive ici seulement si erreur
    if (stripeErr) {
      setError(stripeErr.message ?? 'Une erreur est survenue.')
      setPaying(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.8125rem', color: 'var(--ink-soft)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, width: 'fit-content',
        }}
      >
        ← Modifier mon adresse
      </button>

      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p style={{
          fontSize: '0.8125rem', color: '#dc2626',
          padding: '0.75rem 1rem',
          background: 'rgba(220,38,38,0.06)', borderRadius: '6px',
        }}>
          {error}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        className="btn btn--solid btn--block"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          opacity: (!stripe || paying) ? 0.6 : 1,
          cursor: (!stripe || paying) ? 'not-allowed' : 'pointer',
        }}
      >
        {paying ? (
          <><Loader2 size={15} className="animate-spin" /> Traitement en cours…</>
        ) : (
          <><Lock size={14} strokeWidth={1.8} /> Payer {formatPrice(total)}</>
        )}
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-soft)',
      }}>
        <ShieldCheck size={13} strokeWidth={1.6} />
        Paiement sécurisé — chiffrement SSL 256 bits
      </div>
    </div>
  )
}

// ── Main CartPage ─────────────────────────────────────────────────────────────
export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const { t } = useTranslation()
  const { user } = useUserAuth()
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  const [step, setStep] = useState<Step>('cart')
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM)

  useEffect(() => {
    if (!user || !isConfigured || !supabase) return
    supabase
      .from('profiles')
      .select('full_name, phone, address, address2, city, zip, country')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data: d }) => {
        if (!d) return
        const data = d as any
        setForm(f => ({
          ...f,
          name: data.full_name || f.name,
          phone: data.phone || f.phone,
          email: user.email || f.email,
          address: {
            line1:   data.address  || f.address.line1,
            line2:   data.address2 || f.address.line2,
            city:    data.city     || f.address.city,
            zip:     data.zip      || f.address.zip,
            country: data.country  || f.address.country,
          },
        }))
      })
  }, [user])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [saveAddress, setSaveAddress] = useState(false)

  const set = (field: keyof Omit<CustomerForm, 'address'>, val: string) =>
    setForm(f => ({ ...f, [field]: val }))
  const setAddr = (field: keyof Address, val: string) =>
    setForm(f => ({ ...f, address: { ...f.address, [field]: val } }))

  const isFormValid =
    form.name.trim() &&
    form.email.trim() &&
    form.address.line1.trim() &&
    form.address.city.trim() &&
    form.address.zip.trim()

  const proceedToPayment = useCallback(async () => {
    if (!isFormValid) return
    setLoading(true)
    setError(null)

    try {
      if (!isConfigured) {
        throw new Error('Paiement indisponible en mode démo. Configurez Supabase.')
      }

      const { data, error: fnErr } = await supabase.functions.invoke('create-payment', {
        body: { items, total, customer: form },
      })

      if (fnErr) throw new Error(fnErr.message)
      if (data?.error) throw new Error(data.error)
      if (!data?.clientSecret) throw new Error('Réponse invalide du serveur')

      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)

      if (saveAddress && user && isConfigured && supabase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('profiles').upsert({
          id: user.id,
          full_name: form.name,
          phone: form.phone,
          address: form.address.line1,
          address2: form.address.line2,
          city: form.address.city,
          zip: form.address.zip,
          country: form.address.country,
        } as any, { onConflict: 'id' })
      }

      setStep('payment')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isFormValid, items, total, form])

  if (items.length === 0 && step !== 'payment') {
    return (
      <div className="container">
        <div className="empty" style={{ paddingBlock: 'clamp(5rem, 12vw, 9rem)' }}>
          <p className="eyebrow" style={{ marginBottom: '1rem' }}>{t.nav.cart}</p>
          <h1 className="display h-lg" style={{ marginBottom: '1.25rem' }}>{t.cart.empty}</h1>
          <p className="lead" style={{ marginBottom: '2.5rem' }}>{t.cart.emptySub}</p>
          <Link to="/catalogue" className="btn btn--solid">
            {t.cart.seeCatalogue} <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    )
  }

  const stepLabel = step === 'cart' ? t.cart.title : step === 'details' ? 'Livraison' : 'Paiement'

  return (
    <div className="container">
      <header className="page-head">
        <h1 className="display h-lg">{stepLabel}</h1>
        <p className="lead" style={{ marginTop: '0.5rem' }}>
          {step === 'cart'
            ? `${totalQty} ${totalQty > 1 ? t.cart.articles : t.cart.article}`
            : step === 'details'
            ? 'Renseignez votre adresse de livraison'
            : 'Réglez votre commande en toute sécurité'}
        </p>
        {/* Step indicator */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginTop: '1rem',
          fontSize: '0.75rem', color: 'var(--ink-soft)',
        }}>
          {(['cart', 'details', 'payment'] as Step[]).map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 600,
                background: step === s ? 'var(--bks-brun)' : s === 'payment' && step !== 'payment' ? 'var(--surface-2)' : 'var(--surface)',
                color: step === s ? '#fff' : 'var(--ink-soft)',
              }}>
                {i + 1}
              </span>
              {['Panier', 'Livraison', 'Paiement'][i]}
              {i < 2 && <span style={{ color: 'var(--line)' }}>/</span>}
            </span>
          ))}
        </div>
      </header>

      <div className="cart">

        {/* ── Étape 1 : Panier ── */}
        {step === 'cart' && (
          <div>
            {items.map(item => (
              <div key={`${item.productId}-${item.size}`} className="cart-line">
                <Link to={`/produit/${item.productId}`} className="media">
                  <SmartImage src={IMAGES.products[item.productId]} alt={`${item.brand} ${item.name}`} />
                </Link>
                <div style={{ minWidth: 0 }}>
                  <p className="pcard__brand">{item.brand}</p>
                  <Link to={`/produit/${item.productId}`} className="pcard__name" style={{ display: 'block', marginTop: '0.35rem' }}>
                    {item.name}
                  </Link>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', marginTop: '0.35rem' }}>
                    {t.cart.size} {item.size}
                  </p>
                  <div className="qty">
                    <button onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} aria-label="Retirer un">
                      <Minus size={14} strokeWidth={1.5} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)} aria-label="Ajouter un">
                      <Plus size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <button className="icon-btn" style={{ marginTop: '-10px', marginRight: '-10px' }}
                    onClick={() => removeItem(item.productId, item.size)} aria-label="Supprimer">
                    <X size={16} strokeWidth={1.4} />
                  </button>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Étape 2 : Formulaire adresse ── */}
        {step === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => setStep('cart')} style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.8125rem', color: 'var(--ink-soft)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content',
            }}>
              ← Retour au panier
            </button>

            {!user && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--surface-2, rgba(57,34,22,0.05))',
                borderRadius: 6,
                fontSize: '0.8125rem',
                color: 'var(--ink-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              }}>
                <span>Vous avez déjà un compte ?</span>
                <a href="/connexion" style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>Se connecter</a>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Nom complet *" style={{ gridColumn: '1/-1' }}>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jean Dupont" autoComplete="name" />
              </Field>
              <Field label="Email *" style={{ gridColumn: '1/-1' }}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@example.com" autoComplete="email" />
              </Field>
              <Field label="Téléphone" style={{ gridColumn: '1/-1' }}>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 6 00 00 00 00" autoComplete="tel" />
              </Field>
              <Field label="Adresse *" style={{ gridColumn: '1/-1' }}>
                <input value={form.address.line1} onChange={e => setAddr('line1', e.target.value)} placeholder="12 rue de la Paix" autoComplete="address-line1" />
              </Field>
              <Field label="Complément">
                <input value={form.address.line2} onChange={e => setAddr('line2', e.target.value)} placeholder="Appt, bât…" autoComplete="address-line2" />
              </Field>
              <Field label="Code postal *">
                <input value={form.address.zip} onChange={e => setAddr('zip', e.target.value)} placeholder="75001" autoComplete="postal-code" />
              </Field>
              <Field label="Ville *" style={{ gridColumn: '1/-1' }}>
                <input value={form.address.city} onChange={e => setAddr('city', e.target.value)} placeholder="Paris" autoComplete="address-level2" />
              </Field>
              <Field label="Pays" style={{ gridColumn: '1/-1' }}>
                <select value={form.address.country} onChange={e => setAddr('country', e.target.value)} autoComplete="country">
                  <optgroup label="Europe — Livraison 72h">
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="LU">Luxembourg</option>
                    <option value="ES">Espagne</option>
                    <option value="IT">Italie</option>
                    <option value="DE">Allemagne</option>
                    <option value="NL">Pays-Bas</option>
                    <option value="PT">Portugal</option>
                    <option value="AT">Autriche</option>
                    <option value="GB">Royaume-Uni</option>
                  </optgroup>
                  <optgroup label="International">
                    <option value="US">États-Unis</option>
                    <option value="CA">Canada</option>
                    <option value="AE">Émirats Arabes Unis (Dubaï)</option>
                    <option value="JP">Japon</option>
                    <option value="AU">Australie</option>
                    <option value="SG">Singapour</option>
                  </optgroup>
                </select>
              </Field>
            </div>
            {user && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.8125rem', color: 'var(--ink-soft)', cursor: 'pointer',
                marginTop: '0.25rem',
              }}>
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={e => setSaveAddress(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                Sauvegarder cette adresse dans mon compte
              </label>
            )}

            {error && (
              <p style={{ fontSize: '0.8125rem', color: '#dc2626', padding: '0.75rem 1rem', background: 'rgba(220,38,38,0.06)', borderRadius: '6px' }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Étape 3 : Paiement Stripe ── */}
        {step === 'payment' && clientSecret && (
          <StripeErrorBoundary>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <StripePaymentForm
                orderId={orderId!}
                total={total}
                onBack={() => setStep('details')}
              />
            </Elements>
          </StripeErrorBoundary>
        )}

        {/* ── Récapitulatif commande ── */}
        <aside className="summary">
          <p className="eyebrow" style={{ marginBottom: '1rem' }}>{t.cart.subtotal}</p>
          <div className="summary__row">
            <span>{t.cart.subtotal}</span>
            <span style={{ color: 'var(--ink)' }}>{formatPrice(total)}</span>
          </div>
          <div className="summary__row">
            <span>{t.cart.shipping}</span>
            {total >= 150
              ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Offerte ✓</span>
              : <span>{t.cart.shippingCalc}</span>
            }
          </div>
          {total < 150 && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--accent)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Plus que {(150 - total).toFixed(2).replace('.', ',')} € pour la livraison offerte
            </p>
          )}
          {total >= 150 && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--ink-soft)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Livraison offerte en France · Colissimo suivi
            </p>
          )}
          <div className="summary__total">
            <span>{t.cart.total}</span>
            <span>{formatPrice(total)}</span>
          </div>

          {step === 'cart' && (
            <button
              onClick={() => setStep('details')}
              className="btn btn--solid btn--block"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Renseigner mon adresse <ChevronRight size={15} strokeWidth={1.8} />
            </button>
          )}

          {step === 'details' && (
            <button
              onClick={proceedToPayment}
              disabled={!isFormValid || loading}
              className="btn btn--solid btn--block"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: (!isFormValid || loading) ? 0.5 : 1,
                cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Préparation…</>
                : <>Procéder au paiement <Lock size={14} strokeWidth={1.8} /></>}
            </button>
          )}

          {step === 'payment' && (
            <div style={{
              padding: '0.75rem', borderRadius: '6px', background: 'var(--surface-2)',
              fontSize: '0.75rem', color: 'var(--ink-soft)', textAlign: 'center',
            }}>
              <ShieldCheck size={14} strokeWidth={1.6} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Paiement sécurisé par Stripe
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link to="/catalogue" className="link-arrow">{t.cart.continue}</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: '4px',
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: '0.9375rem',
  outline: 'none',
}

function Field({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactElement
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem',
        color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {cloneElement(children as React.ReactElement<any>, { style: { ...inputStyle, ...(children.props as any).style } })}
    </div>
  )
}
