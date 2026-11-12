import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, TrendingUp, ChevronRight, RefreshCw,
  AlertTriangle, Package, ArrowUpRight, Percent, Euro,
  Loader2, CheckCircle2, AlertCircle, Eye,
} from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbOrder } from '../../types/database'

// Coefficient: PV TTC = PA × 1.65 → marge = 0.65/1.65
const MARKUP = 1.65
const MARGIN_RATE = 0.65 / 1.65

interface FullStats {
  caMonth: number
  caPrevMonth: number
  caToday: number
  margeMonth: number
  panierMoyen: number
  ordersMonth: number
  ordersToday: number
  ordersPending: number
  productsPublished: number
  productsTotal: number
  lastSync: string | null
  visitsToday: number
  visitsMonth: number
  visitsPrevMonth: number
}

interface RecentOrder {
  id: string
  created_at: string
  customer_name: string
  status: string
  payment_status: string
  payment_amount: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: '#92714a', bg: 'rgba(146,113,74,0.1)' },
  confirmed: { label: 'Confirmée',   color: '#3D7A43', bg: 'rgba(61,122,67,0.1)' },
  preparing: { label: 'Préparation', color: '#7A5A86', bg: 'rgba(122,90,134,0.1)' },
  shipped:   { label: 'Expédiée',    color: '#3D6A86', bg: 'rgba(61,106,134,0.1)' },
  delivered: { label: 'Livrée',      color: '#3D7A43', bg: 'rgba(61,122,67,0.1)' },
  cancelled: { label: 'Annulée',     color: '#A6412C', bg: 'rgba(166,65,44,0.1)' },
}

const DEMO: FullStats = {
  caMonth: 2847.50, caPrevMonth: 2210.00, caToday: 189.99,
  margeMonth: 2847.50 * MARGIN_RATE,
  panierMoyen: 189.99,
  ordersMonth: 15, ordersToday: 1, ordersPending: 3,
  productsPublished: 1, productsTotal: 396,
  lastSync: new Date(Date.now() - 3600000).toISOString(),
  visitsToday: 24, visitsMonth: 312, visitsPrevMonth: 198,
}

const DEMO_ORDERS: RecentOrder[] = [
  { id: 'ord-001', created_at: new Date().toISOString(), customer_name: 'Jean Dupont', payment_status: 'paid', status: 'pending', payment_amount: 189.99 },
  { id: 'ord-002', created_at: new Date(Date.now() - 86400000).toISOString(), customer_name: 'Marie Martin', payment_status: 'paid', status: 'shipped', payment_amount: 544.49 },
  { id: 'ord-003', created_at: new Date(Date.now() - 172800000).toISOString(), customer_name: 'Pierre Bernard', payment_status: 'pending', status: 'pending', payment_amount: 329.99 },
]

function money(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = today.getTime() - new Date(d).setHours(0,0,0,0)
  if (diff === 0) return "Auj."
  if (diff === 86400000) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function trend(current: number, prev: number) {
  if (prev === 0) return null
  const pct = ((current - prev) / prev) * 100
  return pct
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<FullStats>(DEMO)
  const [orders, setOrders] = useState<RecentOrder[]>(DEMO_ORDERS)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }

    const load = async () => {
      const now = new Date()
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      const [ordersRes, productsRes, visitsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('id, is_published, last_sync_at').order('last_sync_at', { ascending: false }).limit(500),
        supabase.from('page_views').select('visited_at').gte('visited_at', startPrevMonth),
      ])

      const allOrders: DbOrder[] = ordersRes.data ?? []
      const allProducts = (productsRes.data ?? []) as { id: string; is_published: boolean; last_sync_at: string | null }[]

      const paidOrders = allOrders.filter(o => o.payment_status === 'paid')
      const monthOrders = paidOrders.filter(o => o.created_at >= startMonth)
      const prevMonthOrders = paidOrders.filter(o => o.created_at >= startPrevMonth && o.created_at <= endPrevMonth)
      const todayOrders = paidOrders.filter(o => o.created_at >= startToday)
      const pending = allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed')

      const caMonth = monthOrders.reduce((s, o) => s + (o.payment_amount ?? 0), 0)
      const caPrevMonth = prevMonthOrders.reduce((s, o) => s + (o.payment_amount ?? 0), 0)
      const caToday = todayOrders.reduce((s, o) => s + (o.payment_amount ?? 0), 0)

      // Marge réelle depuis order_items.unit_price_buy (si disponible)
      const orderIds = monthOrders.map(o => o.id)
      let margeMonth = caMonth * MARGIN_RATE // fallback coefficient
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('unit_price, unit_price_buy, quantity')
          .in('order_id', orderIds)
        if (itemsData?.some((i: any) => i.unit_price_buy != null)) {
          margeMonth = (itemsData as any[]).reduce((s: number, i: any) => {
            const buy = i.unit_price_buy ?? i.unit_price / MARKUP
            return s + (i.unit_price - buy) * (i.quantity ?? 1)
          }, 0)
        }
      }

      const lastSync = allProducts.find(p => p.last_sync_at)?.last_sync_at ?? null

      const allViews = (visitsRes.data ?? []) as { visited_at: string }[]
      const visitsToday = allViews.filter(v => v.visited_at >= startToday).length
      const visitsMonth = allViews.filter(v => v.visited_at >= startMonth).length
      const visitsPrevMonth = allViews.filter(v => v.visited_at >= startPrevMonth && v.visited_at < startMonth).length

      setStats({
        caMonth, caPrevMonth, caToday,
        margeMonth,
        panierMoyen: monthOrders.length > 0 ? caMonth / monthOrders.length : 0,
        ordersMonth: monthOrders.length,
        ordersToday: todayOrders.length,
        ordersPending: pending.length,
        productsPublished: allProducts.filter(p => p.is_published).length,
        productsTotal: allProducts.length,
        lastSync,
        visitsToday, visitsMonth, visitsPrevMonth,
      })
      setOrders(allOrders.slice(0, 6) as RecentOrder[])
      setLoading(false)
    }
    load()
  }, [])

  const syncCatalog = async () => {
    if (!isConfigured) return
    setSyncing(true); setSyncResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('sync-catalog', { body: {} })
      if (error) throw new Error(error.message)
      if (!data?.ok) throw new Error(data?.error ?? 'Erreur inconnue')
      setSyncResult({ ok: true, msg: `${data.products_synced} produits synchronisés` })
    } catch (e) {
      setSyncResult({ ok: false, msg: (e as Error).message })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div style={{padding:'5rem 0', textAlign:'center', color:'var(--ink-faint)'}}><Loader2 size={24} className="animate-spin" color="var(--accent)" /></div>

  const caT = trend(stats.caMonth, stats.caPrevMonth)
  const trendColor = caT !== null ? (caT >= 0 ? '#3D7A43' : '#A6412C') : undefined
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const pubRate = stats.productsTotal > 0 ? (stats.productsPublished / stats.productsTotal) * 100 : 0

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1.75rem'}}>

      {/* Header */}
      <div style={{display:'flex', flexWrap:'wrap', alignItems:'flex-end', justifyContent:'space-between', gap:'1rem'}}>
        <div>
          <p style={{fontSize:'0.6875rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
            {today}
          </p>
          <h1 style={{fontFamily:'var(--ff-display)', fontWeight:500, fontSize:'clamp(1.875rem, 2.8vw, 2.5rem)', lineHeight:1.05, color:'var(--ink)', margin:0}}>
            {t.admin.dashboard.title}
          </h1>
        </div>
        {!isConfigured && <span className="admin-tag">Mode démo</span>}
      </div>

      {/* Alert: commandes en attente */}
      {stats.ordersPending > 0 && (
        <Link to="/admin/commandes" style={{
          display:'flex', alignItems:'center', gap:'1rem',
          padding:'1rem 1.25rem', borderRadius:10,
          background:'rgba(146,113,74,0.08)',
          border:'1px solid rgba(146,113,74,0.22)',
          textDecoration:'none',
        }}>
          <div style={{width:36, height:36, borderRadius:8, background:'rgba(146,113,74,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <AlertTriangle size={18} color="#92714a" strokeWidth={1.8} />
          </div>
          <div style={{flex:1, minWidth:0}}>
            <p style={{fontSize:'0.875rem', fontWeight:600, color:'#5C3D14', margin:0}}>
              {stats.ordersPending} commande{stats.ordersPending > 1 ? 's' : ''} à traiter
            </p>
            <p style={{fontSize:'0.75rem', color:'rgba(92,61,20,0.65)', margin:'0.1rem 0 0'}}>
              Cliquez pour voir les commandes en attente
            </p>
          </div>
          <ChevronRight size={16} color="#92714a" strokeWidth={2} />
        </Link>
      )}

      {/* KPIs financiers */}
      <div>
        <p style={{fontSize:'0.5625rem', fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--ink-faint)', marginBottom:'0.75rem'}}>
          Performance financière · 30 derniers jours
        </p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'0.75rem'}}>

          {/* CA mensuel */}
          <div className="admin-card" style={{padding:'1.5rem'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
              <div style={{width:34, height:34, borderRadius:8, background:'rgba(200,149,90,0.12)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Euro size={16} color="var(--accent)" strokeWidth={1.8} />
              </div>
              {caT !== null && (
                <span style={{display:'flex', alignItems:'center', gap:'0.2rem', fontSize:'0.6875rem', fontWeight:700, color: trendColor}}>
                  <ArrowUpRight size={12} strokeWidth={2.5} style={{transform: caT < 0 ? 'rotate(90deg)' : undefined}} />
                  {Math.abs(caT).toFixed(0)}%
                </span>
              )}
            </div>
            <p style={{fontSize:'0.6875rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
              Chiffre d'affaires
            </p>
            <p style={{fontFamily:'var(--ff-display)', fontSize:'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight:500, lineHeight:1, color:'var(--ink)', margin:0}}>
              {money(stats.caMonth)}
            </p>
            {stats.caToday > 0 && (
              <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
                +{money(stats.caToday)} aujourd'hui
              </p>
            )}
          </div>

          {/* Marge brute */}
          <div className="admin-card" style={{padding:'1.5rem'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
              <div style={{width:34, height:34, borderRadius:8, background:'rgba(61,122,67,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Percent size={16} color="#3D7A43" strokeWidth={1.8} />
              </div>
              <span style={{fontSize:'0.6875rem', fontWeight:700, color:'#3D7A43'}}>
                39,4%
              </span>
            </div>
            <p style={{fontSize:'0.6875rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
              Marge brute
            </p>
            <p style={{fontFamily:'var(--ff-display)', fontSize:'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight:500, lineHeight:1, color:'var(--ink)', margin:0}}>
              {money(stats.margeMonth)}
            </p>
            <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
              Après coût fournisseur
            </p>
          </div>

          {/* Panier moyen */}
          <div className="admin-card" style={{padding:'1.5rem'}}>
            <div style={{marginBottom:'1rem'}}>
              <div style={{width:34, height:34, borderRadius:8, background:'rgba(74,106,134,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <ShoppingBag size={16} color="#4A6A86" strokeWidth={1.8} />
              </div>
            </div>
            <p style={{fontSize:'0.6875rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
              Panier moyen
            </p>
            <p style={{fontFamily:'var(--ff-display)', fontSize:'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight:500, lineHeight:1, color:'var(--ink)', margin:0}}>
              {stats.panierMoyen > 0 ? money(stats.panierMoyen) : '—'}
            </p>
            <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
              {stats.ordersMonth} commande{stats.ordersMonth !== 1 ? 's' : ''} ce mois
            </p>
          </div>

          {/* Commandes */}
          <div className="admin-card" style={{padding:'1.5rem'}}>
            <div style={{marginBottom:'1rem'}}>
              <div style={{width:34, height:34, borderRadius:8, background:'rgba(200,149,90,0.12)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <TrendingUp size={16} color="var(--accent)" strokeWidth={1.8} />
              </div>
            </div>
            <p style={{fontSize:'0.6875rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
              Commandes
            </p>
            <p style={{fontFamily:'var(--ff-display)', fontSize:'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight:500, lineHeight:1, color:'var(--ink)', margin:0}}>
              {stats.ordersMonth}
            </p>
            <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
              {stats.ordersToday > 0 ? `+${stats.ordersToday} aujourd'hui` : 'Ce mois-ci'}
            </p>
          </div>

          {/* Visites */}
          {(() => {
            const vTrend = stats.visitsPrevMonth > 0 ? ((stats.visitsMonth - stats.visitsPrevMonth) / stats.visitsPrevMonth) * 100 : null
            return (
              <div className="admin-card" style={{padding:'1.5rem'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                  <div style={{width:34, height:34, borderRadius:8, background:'rgba(61,106,134,0.1)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <Eye size={16} color="#3D6A86" strokeWidth={1.8} />
                  </div>
                  {vTrend !== null && (
                    <span style={{display:'flex', alignItems:'center', gap:'0.2rem', fontSize:'0.6875rem', fontWeight:700, color: vTrend >= 0 ? '#3D7A43' : '#A6412C'}}>
                      <ArrowUpRight size={12} strokeWidth={2.5} style={{transform: vTrend < 0 ? 'rotate(90deg)' : undefined}} />
                      {Math.abs(vTrend).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p style={{fontSize:'0.6875rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>
                  Visites
                </p>
                <p style={{fontFamily:'var(--ff-display)', fontSize:'clamp(1.75rem, 2.5vw, 2.25rem)', fontWeight:500, lineHeight:1, color:'var(--ink)', margin:0}}>
                  {stats.visitsMonth.toLocaleString('fr-FR')}
                </p>
                <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
                  {stats.visitsToday > 0 ? `${stats.visitsToday} aujourd'hui` : 'Ce mois-ci'}
                </p>
              </div>
            )
          })()}

        </div>
      </div>

      {/* Catalogue + Sync */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'0.75rem'}}>

        {/* Catalogue */}
        <div className="admin-card" style={{padding:'1.25rem 1.5rem'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
            <p style={{fontSize:'0.6875rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-soft)', margin:0}}>
              Catalogue
            </p>
            <Link to="/admin/produits" className="admin-link" style={{fontSize:'0.6875rem'}}>
              Gérer <ChevronRight size={11} strokeWidth={2.5} />
            </Link>
          </div>
          <div style={{display:'flex', alignItems:'baseline', gap:'0.5rem', marginBottom:'0.75rem'}}>
            <span style={{fontFamily:'var(--ff-display)', fontSize:'2rem', fontWeight:500, lineHeight:1, color:'var(--ink)'}}>
              {stats.productsPublished}
            </span>
            <span style={{fontSize:'0.75rem', color:'var(--ink-faint)'}}>
              / {stats.productsTotal} produits en ligne
            </span>
          </div>
          {/* Barre de publication */}
          <div style={{height:4, background:'var(--surface-2)', borderRadius:2, overflow:'hidden'}}>
            <div style={{
              height:'100%', borderRadius:2,
              width:`${pubRate}%`,
              background: pubRate > 50 ? '#3D7A43' : pubRate > 20 ? 'var(--accent)' : '#A6412C',
              transition:'width 0.4s',
            }} />
          </div>
          <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.4rem'}}>
            {pubRate.toFixed(0)}% publié{stats.productsTotal - stats.productsPublished > 0 ? ` · ${stats.productsTotal - stats.productsPublished} en attente` : ''}
          </p>
        </div>

        {/* Sync GS */}
        <div className="admin-card" style={{padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <p style={{fontSize:'0.6875rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-soft)', margin:0}}>
              Golden Sneakers
            </p>
            {stats.lastSync && (
              <span style={{fontSize:'0.6875rem', color:'var(--ink-faint)'}}>
                {formatDate(stats.lastSync)}
              </span>
            )}
          </div>
          <p style={{fontSize:'0.8125rem', color:'var(--ink-soft)', margin:0, lineHeight:1.5}}>
            {stats.productsTotal} produits fournisseur · dernière sync {stats.lastSync ? formatDate(stats.lastSync) : 'jamais'}
          </p>
          {syncResult && (
            <div style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', fontWeight:500, color: syncResult.ok ? '#3D7A43' : '#A6412C'}}>
              {syncResult.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {syncResult.msg}
            </div>
          )}
          <button
            onClick={syncCatalog}
            disabled={syncing || !isConfigured}
            style={{
              display:'inline-flex', alignItems:'center', gap:'0.5rem',
              padding:'0.5rem 1rem', borderRadius:6, border:'1px solid var(--line)',
              background:'transparent', cursor: syncing || !isConfigured ? 'not-allowed' : 'pointer',
              fontSize:'0.8125rem', fontWeight:600, color:'var(--ink)',
              opacity: !isConfigured ? 0.4 : 1,
              alignSelf:'flex-start', transition:'background 0.15s',
            }}
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} strokeWidth={2} />}
            {syncing ? 'Synchronisation…' : 'Sync maintenant'}
          </button>
        </div>

      </div>

      {/* Commandes récentes */}
      <div className="admin-card">
        <div className="admin-card__head">
          <h2>{t.admin.dashboard.recentOrders}</h2>
          <Link to="/admin/commandes" className="admin-link">
            Voir tout <ChevronRight size={12} strokeWidth={2.5} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{padding:'3rem 1.5rem', textAlign:'center'}}>
            <Package size={28} style={{margin:'0 auto 0.75rem', opacity:0.3}} color="var(--ink)" />
            <p style={{fontSize:'0.875rem', color:'var(--ink-faint)'}}>Aucune commande pour l'instant</p>
          </div>
        ) : (
          <div>
            {orders.map((order, idx) => {
              const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              return (
                <Link key={order.id} to={`/admin/commandes/${order.id}`} style={{
                  display:'grid',
                  gridTemplateColumns:'minmax(0,1fr) auto auto',
                  alignItems:'center',
                  gap:'1rem',
                  padding:'0.875rem 1.5rem',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--line)',
                  textDecoration:'none',
                  transition:'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,90,48,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:'0.9375rem', fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0}}>
                      {order.customer_name || 'Client'}
                    </p>
                    <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.15rem', margin:0}}>
                      {formatDate(order.created_at)} · #{order.id?.slice(0,8).toUpperCase()}
                      {order.payment_status === 'pending' && (
                        <span style={{marginLeft:'0.5rem', color:'#A6412C', fontWeight:600}}>· Paiement en attente</span>
                      )}
                    </p>
                  </div>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:'0.35rem',
                    padding:'0.25rem 0.65rem', borderRadius:999,
                    fontSize:'0.625rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                    background: st.bg, color: st.color, whiteSpace:'nowrap',
                  }}>
                    {st.label}
                  </span>
                  <span style={{fontWeight:700, fontSize:'0.9375rem', color:'var(--ink)', whiteSpace:'nowrap', textAlign:'right'}}>
                    {order.payment_amount != null ? money(order.payment_amount) : '—'}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div style={{display:'flex', flexWrap:'wrap', gap:'0.625rem'}}>
        <Link to="/admin/produits/nouveau" className="btn-primary">
          <Package size={15} strokeWidth={2} /> Ajouter un produit
        </Link>
        <Link to="/admin/commandes" className="btn-outline">
          <ShoppingBag size={15} strokeWidth={1.8} /> Commandes
        </Link>
        <Link to="/admin/produits" className="btn-outline">
          <RefreshCw size={15} strokeWidth={1.8} /> Catalogue
        </Link>
      </div>

    </div>
  )
}
