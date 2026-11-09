import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useUserAuth } from '../context/UserAuthContext'
import { supabase, isConfigured } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import SEOHead from '../components/SEOHead'
import { Package, User, LogOut, ChevronRight } from 'lucide-react'

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

const STATUS_MAP: Record<string, { fr: string; color: string }> = {
  pending:   { fr: 'En attente',  color: '#92714a' },
  confirmed: { fr: 'Confirmée',   color: '#2d7a3a' },
  shipped:   { fr: 'Expédiée',    color: '#1a5fa8' },
  delivered: { fr: 'Livrée',      color: '#2d7a3a' },
  cancelled: { fr: 'Annulée',     color: '#dc2626' },
}

export default function MonComptePage() {
  const { t, locale } = useTranslation()
  const a = t.auth
  const { user, loading, signOut } = useUserAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'orders' | 'info'>('orders')
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
      .eq('customer_email', user.email!)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as unknown as Order[]))
  }, [user])

  useEffect(() => {
    if (!user || !isConfigured || !supabase) return
    supabase
      .from('profiles')
      .select('full_name, phone, address, address2, city, zip, country')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ ...EMPTY_PROFILE, ...(data as any) })
        else if (user.user_metadata?.first_name) {
          const full = [user.user_metadata.first_name, user.user_metadata.last_name].filter(Boolean).join(' ')
          setProfile(p => ({ ...p, full_name: full }))
        }
      })
  }, [user])

  const handleSave = useCallback(async () => {
    if (!user || !isConfigured || !supabase) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile } as any, { onConflict: 'id' })
    setSaving(false)
    if (error) addToast('Erreur lors de la sauvegarde', 'error')
    else addToast('Informations sauvegardées')
  }, [user, profile, addToast])

  const setField = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile(prev => ({ ...prev, [key]: e.target.value }))

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading || !user) return null

  const displayName = profile.full_name || user.user_metadata?.first_name || user.email?.split('@')[0] || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SEOHead path="/mon-compte" titleFr="Mon compte" titleEn="My account" noIndex />

      {/* Hero header */}
      <div style={{
        background: 'var(--bks-brun, #2E1B11)',
        color: '#fff',
        paddingBlock: 'clamp(2.5rem, 6vw, 4rem)',
      }}>
        <div className="container">
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.5rem' }}>
            Votre espace
          </p>
          <h1 className="display h-lg" style={{ color: '#fff', marginBottom: '0.5rem' }}>
            {displayName ? `Bonjour, ${displayName.split(' ')[0]}` : 'Votre compte BKS'}
          </h1>
          <p style={{ opacity: 0.55, fontSize: '0.875rem' }}>{user.email}</p>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '2rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--line)' }}>
            {([
              { key: 'orders', label: 'Mes commandes', icon: <Package size={15} strokeWidth={1.6} /> },
              { key: 'info',   label: 'Mes informations', icon: <User size={15} strokeWidth={1.6} /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.75rem 1.25rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: tab === key ? '2px solid var(--bks-brun, #2E1B11)' : '2px solid transparent',
                  marginBottom: '-1px',
                  color: tab === key ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: tab === key ? 600 : 400,
                  fontSize: '0.875rem',
                  transition: 'color .15s',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ── Commandes ── */}
          {tab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div style={{
                  padding: '3rem 2rem', textAlign: 'center',
                  border: '1px dashed var(--line)', borderRadius: 10,
                  color: 'var(--ink-soft)',
                }}>
                  <Package size={36} strokeWidth={1.2} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Aucune commande pour l'instant</p>
                  <p style={{ fontSize: '0.8125rem' }}>Vos commandes apparaîtront ici après votre premier achat.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {orders.map(o => {
                    const st = STATUS_MAP[o.status] ?? { fr: o.status, color: 'var(--ink-soft)' }
                    return (
                      <div key={o.id} style={{
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '1rem',
                        alignItems: 'center',
                        background: '#fff',
                      }}>
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--ink-soft)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Référence</p>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}>{o.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--ink-soft)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</p>
                          <p style={{ fontSize: '0.875rem' }}>{new Date(o.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--ink-soft)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</p>
                          <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{o.total.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--ink-soft)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Statut</p>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.75rem', fontWeight: 600,
                            padding: '0.2rem 0.6rem', borderRadius: 20,
                            background: `${st.color}18`,
                            color: st.color,
                          }}>
                            {st.fr}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <ChevronRight size={16} strokeWidth={1.5} color="var(--ink-soft)" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Informations ── */}
          {tab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

              {/* Bloc identité */}
              <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>
                  Identité
                </h2>
                <div className="field">
                  <label>Nom complet</label>
                  <input type="text" value={profile.full_name} onChange={setField('full_name')} placeholder="Jean Dupont" autoComplete="name" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={user.email ?? ''} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
                </div>
                <div className="field">
                  <label>Téléphone</label>
                  <input type="tel" value={profile.phone} onChange={setField('phone')} placeholder="+33 6 00 00 00 00" autoComplete="tel" />
                </div>
              </section>

              {/* Bloc adresse */}
              <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>
                  Adresse de livraison
                </h2>
                <div className="field">
                  <label>Adresse</label>
                  <input type="text" value={profile.address} onChange={setField('address')} placeholder="12 rue de la Paix" autoComplete="address-line1" />
                </div>
                <div className="field">
                  <label>Complément</label>
                  <input type="text" value={profile.address2} onChange={setField('address2')} placeholder="Appt, bât…" autoComplete="address-line2" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
                  <div className="field">
                    <label>Code postal</label>
                    <input type="text" value={profile.zip} onChange={setField('zip')} placeholder="75001" autoComplete="postal-code" />
                  </div>
                  <div className="field">
                    <label>Ville</label>
                    <input type="text" value={profile.city} onChange={setField('city')} placeholder="Paris" autoComplete="address-level2" />
                  </div>
                </div>
                <div className="field">
                  <label>Pays</label>
                  <select value={profile.country} onChange={setField('country')} autoComplete="country">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </section>

              {/* Bouton save pleine largeur */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                <button
                  className="btn btn--solid"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ minWidth: 220 }}
                >
                  {saving ? 'Sauvegarde…' : 'Sauvegarder mes informations'}
                </button>
              </div>
            </div>
          )}

          {/* Liens utiles */}
          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link to="/livraison" style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', textDecoration: 'underline' }}>
                Politique de retour
              </Link>
              <Link to="/contact" style={{ fontSize: '0.8125rem', color: 'var(--ink-soft)', textDecoration: 'underline' }}>
                Nous contacter
              </Link>
            </div>

            <button
              onClick={handleSignOut}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.8125rem', color: 'var(--ink-soft)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <LogOut size={14} strokeWidth={1.6} />
              {a.signOut}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
