import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, TrendingUp, ChevronRight, Clock } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbOrder } from '../../types/database'
import { PRODUCTS } from '../../data/products'

interface Stats {
  ordersToday: number
  pendingOrders: number
  publishedProducts: number
  unpublishedProducts: number
  revenueMonth: number
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#8A5A30',
  confirmed: '#4A6A86',
  preparing: '#7A5A86',
  shipped: '#3D7A76',
  delivered: '#4E7A43',
  cancelled: '#A6412C',
}

function StatCard({ icon, value, label, sub }: {
  icon: React.ReactNode; value: string | number; label: string; sub?: string
}) {
  return (
    <div className="stat">
      <div className="stat__icon">{icon}</div>
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {sub && <p className="stat__sub">{sub}</p>}
    </div>
  )
}

// Demo orders for when Supabase is not configured
const DEMO_ORDERS: Partial<DbOrder>[] = [
  {
    id: 'ord-001',
    created_at: new Date().toISOString(),
    customer_name: 'Jean Dupont',
    customer_email: 'jean@example.com',
    payment_status: 'paid',
    status: 'pending',
    payment_amount: 189.99,
  },
  {
    id: 'ord-002',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    customer_name: 'Marie Martin',
    customer_email: 'marie@example.com',
    payment_status: 'paid',
    status: 'shipped',
    payment_amount: 109.99,
  },
  {
    id: 'ord-003',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    customer_name: 'Pierre Bernard',
    customer_email: 'pierre@example.com',
    payment_status: 'pending',
    status: 'pending',
    payment_amount: 249.98,
  },
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({
    ordersToday: 0,
    pendingOrders: 0,
    publishedProducts: 0,
    unpublishedProducts: 0,
    revenueMonth: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Partial<DbOrder>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      // Mode démo sans Supabase
      const published = PRODUCTS.length
      setStats({
        ordersToday: 1,
        pendingOrders: 2,
        publishedProducts: published,
        unpublishedProducts: 0,
        revenueMonth: 549.96,
      })
      setRecentOrders(DEMO_ORDERS)
      setLoading(false)
      return
    }

    const load = async () => {
      const today = new Date(); today.setHours(0,0,0,0)

      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('products').select('id, is_published'),
      ])

      const orders: DbOrder[] = ordersRes.data ?? []
      const _products = (productsRes.data ?? []) as { id: string; is_published: boolean }[]
      const products = _products

      const todayOrders = orders.filter(o => new Date(o.created_at) >= today)
      const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed')
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const revenue = orders
        .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= thirtyDaysAgo)
        .reduce((sum, o) => sum + (o.payment_amount ?? 0), 0)

      setStats({
        ordersToday: todayOrders.length,
        pendingOrders: pending.length,
        publishedProducts: products.filter((item: { is_published: boolean }) => item.is_published).length,
        unpublishedProducts: products.filter((item: { is_published: boolean }) => !item.is_published).length,
        revenueMonth: revenue,
      })
      setRecentOrders(orders.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = today.getTime() - new Date(d).setHours(0,0,0,0)
    if (diff === 0) return "Aujourd'hui"
    if (diff === 86400000) return 'Hier'
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  if (loading) return <div style={{padding:'5rem 0', textAlign:'center', color:'var(--ink-faint)'}}>…</div>

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const money = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <div>
      <div className="admin-head">
        <div>
          <p className="eyebrow" style={{textTransform:'uppercase'}}>{today}</p>
          <h1>{t.admin.dashboard.title}</h1>
        </div>
        {!isConfigured && <span className="admin-tag">Mode démo</span>}
      </div>

      <div className="stats">
        <StatCard icon={<ShoppingBag size={16} strokeWidth={1.6} />} value={stats.ordersToday} label={t.admin.dashboard.ordersToday} />
        <StatCard icon={<Clock size={16} strokeWidth={1.6} />} value={stats.pendingOrders} label={t.admin.dashboard.pendingOrders} />
        <StatCard icon={<Package size={16} strokeWidth={1.6} />} value={stats.publishedProducts} label={t.admin.dashboard.publishedProducts}
          sub={`${stats.unpublishedProducts} non publiés`} />
        <StatCard icon={<TrendingUp size={16} strokeWidth={1.6} />} value={money(stats.revenueMonth)} label={t.admin.dashboard.revenue} />
      </div>

      <div className="admin-card" style={{marginBottom:'2rem'}}>
        <div className="admin-card__head">
          <h2>{t.admin.dashboard.recentOrders}</h2>
          <Link to="/admin/commandes" className="admin-link">
            {t.admin.dashboard.viewAll} <ChevronRight size={12} strokeWidth={2} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p style={{padding:'3rem 1.5rem', textAlign:'center', color:'var(--ink-faint)', fontSize:'0.875rem'}}>{t.admin.orders.empty}</p>
        ) : (
          <div>
            {recentOrders.map(order => {
              const color = ORDER_STATUS_COLORS[order.status ?? 'pending']
              return (
                <Link key={order.id} to={`/admin/commandes/${order.id}`} className="order-row">
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:'0.9375rem', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{order.customer_name}</p>
                    <p style={{fontSize:'0.6875rem', color:'var(--ink-faint)', marginTop:'0.2rem', letterSpacing:'0.03em'}}>
                      {order.created_at ? formatDate(order.created_at) : ''} · #{order.id?.slice(0,8).toUpperCase()}
                    </p>
                  </div>
                  <span className="badge" style={{background:`${color}14`, color}}>
                    {t.admin.orders.statuses[order.status as keyof typeof t.admin.orders.statuses ?? 'pending'] ?? order.status}
                  </span>
                  <span style={{fontWeight:700, fontSize:'0.9375rem', whiteSpace:'nowrap', minWidth:'5.5rem', textAlign:'right'}}>
                    {order.payment_amount != null ? money(order.payment_amount) : ''}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div style={{display:'flex', flexWrap:'wrap', gap:'0.75rem'}}>
        <Link to="/admin/produits/nouveau" className="btn-primary">Ajouter un produit</Link>
        <Link to="/admin/commandes" className="btn-outline">Voir les commandes</Link>
      </div>
    </div>
  )
}
