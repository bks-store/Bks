import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useUserAuth } from '../context/UserAuthContext'
import { supabase, isConfigured } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import SEOHead from '../components/SEOHead'

interface Order {
  id: string
  created_at: string
  total: number
  status: string
  payment_status: string
}

interface Profile {
  full_name: string
  phone: string
  address: string
  address2: string
  city: string
  zip: string
  country: string
}

const EMPTY_PROFILE: Profile = {
  full_name: '', phone: '', address: '', address2: '', city: '', zip: '', country: 'FR',
}

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'PT', label: 'Portugal' },
  { code: 'AT', label: 'Autriche' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'US', label: 'États-Unis' },
  { code: 'CA', label: 'Canada' },
  { code: 'AE', label: 'Émirats Arabes Unis' },
  { code: 'JP', label: 'Japon' },
  { code: 'AU', label: 'Australie' },
  { code: 'SG', label: 'Singapour' },
]

function statusLabel(s: string, locale: string) {
  const map: Record<string, { fr: string; en: string }> = {
    pending:   { fr: 'En attente', en: 'Pending' },
    confirmed: { fr: 'Confirmée',  en: 'Confirmed' },
    shipped:   { fr: 'Expédiée',   en: 'Shipped' },
    delivered: { fr: 'Livrée',     en: 'Delivered' },
    cancelled: { fr: 'Annulée',    en: 'Cancelled' },
  }
  return (map[s]?.[locale as 'fr' | 'en']) ?? s
}

export default function MonComptePage() {
  const { t, locale } = useTranslation()
  const a = t.auth
  const { user, loading, signOut } = useUserAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'orders' | 'info' | 'address'>('orders')
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/connexion', { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user || !isConfigured || !supabase) return
    supabase
      .from('orders')
      .select('id, created_at, total, status, payment_status')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))
  }, [user])

  useEffect(() => {
    if (!user || !isConfigured || !supabase) return
    supabase
      .from('profiles')
      .select('full_name, phone, address, address2, city, zip, country')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile({ ...EMPTY_PROFILE, ...data }) })
  }, [user])

  const handleSaveAddress = useCallback(async () => {
    if (!user || !isConfigured || !supabase) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile }, { onConflict: 'id' })
    setSaving(false)
    if (error) addToast('Erreur lors de la sauvegarde', 'error')
    else addToast('Adresse sauvegardée')
  }, [user, profile, addToast])

  const setField = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile(prev => ({ ...prev, [key]: e.target.value }))

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading || !user) return null

  const firstName = user.user_metadata?.first_name ?? ''
  const lastName  = user.user_metadata?.last_name ?? ''

  return (
    <div className="container" style={{ paddingBlock: 'var(--section)' }}>
      <SEOHead
        path="/mon-compte"
        titleFr="Mon compte — BKS"
        titleEn="My account — BKS"
        noIndex
      />

      <header className="page-head" style={{ marginBottom: '2.5rem' }}>
        <h1 className="display h-xl">
          {firstName ? `${a.welcomeBack}, ${firstName}` : a.welcomeBack}
        </h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: '0.5rem' }}>{user.email}</p>
      </header>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--line)' }}>
        {(['orders', 'info', 'address'] as const).map(tab_ => (
          <button
            key={tab_}
            onClick={() => setTab(tab_)}
            className="btn"
            style={{
              borderBottom: tab === tab_ ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0, paddingInline: 0, paddingBottom: '0.75rem',
              color: tab === tab_ ? 'var(--ink)' : 'var(--ink-soft)',
              fontWeight: tab === tab_ ? 600 : 400,
            }}
          >
            {tab_ === 'orders' ? a.myOrders : tab_ === 'info' ? a.myInfo : 'Mon adresse'}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>{a.noOrders}</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {orders.map(o => (
                <div key={o.id} style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8, padding: '1.25rem',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem',
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>{a.orderNumber}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{o.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>{a.orderDate}</p>
                    <p style={{ fontSize: '0.875rem' }}>{new Date(o.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>{a.orderTotal}</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{o.total.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>{a.orderStatus}</p>
                    <p style={{ fontSize: '0.875rem' }}>{statusLabel(o.status, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'info' && (
        <div style={{ display: 'grid', gap: '1rem', maxWidth: 400 }}>
          <div className="field">
            <label>{a.firstName}</label>
            <input type="text" value={firstName} readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="field">
            <label>{a.lastName}</label>
            <input type="text" value={lastName} readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="field">
            <label>{a.email}</label>
            <input type="email" value={user.email ?? ''} readOnly style={{ opacity: 0.7 }} />
          </div>
        </div>
      )}

      {tab === 'address' && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Cette adresse sera pré-remplie automatiquement à la commande.
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="field">
              <label>Nom complet</label>
              <input type="text" value={profile.full_name} onChange={setField('full_name')} placeholder="Jean Dupont" autoComplete="name" />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input type="tel" value={profile.phone} onChange={setField('phone')} placeholder="+33 6 00 00 00 00" autoComplete="tel" />
            </div>
            <div className="field">
              <label>Adresse *</label>
              <input type="text" value={profile.address} onChange={setField('address')} placeholder="12 rue de la Paix" autoComplete="address-line1" />
            </div>
            <div className="field">
              <label>Complément</label>
              <input type="text" value={profile.address2} onChange={setField('address2')} placeholder="Appt, bât…" autoComplete="address-line2" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Code postal *</label>
                <input type="text" value={profile.zip} onChange={setField('zip')} placeholder="75001" autoComplete="postal-code" />
              </div>
              <div className="field">
                <label>Ville *</label>
                <input type="text" value={profile.city} onChange={setField('city')} placeholder="Paris" autoComplete="address-level2" />
              </div>
            </div>
            <div className="field">
              <label>Pays</label>
              <select value={profile.country} onChange={setField('country')} autoComplete="country">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <button className="btn btn--solid" onClick={handleSaveAddress} disabled={saving} style={{ marginTop: '0.5rem' }}>
              {saving ? 'Sauvegarde…' : 'Sauvegarder mon adresse'}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--line)' }}>
        <button className="btn btn--outline" onClick={handleSignOut}>{a.signOut}</button>
      </div>
    </div>
  )
}
