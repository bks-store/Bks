import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbOrder } from '../../types/database'

const STATUS_COLORS: Record<string, string> = {
  pending: '#8A5A30', confirmed: '#4A6A86', preparing: '#7A5A86',
  shipped: '#3D7A76', delivered: '#4E7A43', cancelled: '#A6412C',
}
const PAYMENT_COLORS: Record<string, string> = {
  pending: '#8A5A30', paid: '#4E7A43', failed: '#A6412C', refunded: '#7A5A86',
}

const DEMO_ORDERS: DbOrder[] = [
  { id: 'ord-001', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    customer_name: 'Jean Dupont', customer_email: 'jean@example.com', customer_phone: null,
    shipping_address: null, stripe_session_id: null, stripe_payment_id: null,
    payment_status: 'paid', payment_amount: 189.99, status: 'pending',
    shipping_method: 'colissimo', tracking_number: null, shipping_cost: 7.90, notes: null },
  { id: 'ord-002', created_at: new Date(Date.now()-86400000).toISOString(), updated_at: new Date().toISOString(),
    customer_name: 'Marie Martin', customer_email: 'marie@example.com', customer_phone: null,
    shipping_address: null, stripe_session_id: null, stripe_payment_id: null,
    payment_status: 'paid', payment_amount: 109.99, status: 'shipped',
    shipping_method: 'colissimo', tracking_number: 'CP123456789FR', shipping_cost: 7.90, notes: null },
  { id: 'ord-003', created_at: new Date(Date.now()-172800000).toISOString(), updated_at: new Date().toISOString(),
    customer_name: 'Pierre Bernard', customer_email: 'pierre@example.com', customer_phone: null,
    shipping_address: null, stripe_session_id: null, stripe_payment_id: null,
    payment_status: 'pending', payment_amount: 249.98, status: 'pending',
    shipping_method: 'colissimo', tracking_number: null, shipping_cost: 7.90, notes: null },
]

export default function AdminOrders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<DbOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      if (!isConfigured) { setOrders(DEMO_ORDERS); setLoading(false); return }
      const { data } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false })
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filterOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: t.admin.orders.statuses.pending },
    { value: 'confirmed', label: t.admin.orders.statuses.confirmed },
    { value: 'preparing', label: t.admin.orders.statuses.preparing },
    { value: 'shipped', label: t.admin.orders.statuses.shipped },
  ]

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR',
    { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div style={{marginBottom:'2rem'}}>
        <p className="eyebrow">Ventes</p>
        <h1 className="admin-title">
          {t.admin.orders.title}
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filterOptions.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === opt.value ? 'var(--bks-brun)' : 'var(--line)',
              color: filter === opt.value ? 'var(--bks-creme)' : 'var(--ink-soft)',
              border: `1px solid ${filter === opt.value ? 'var(--bks-brun)' : 'var(--line)'}`,
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" color="var(--bks-brun)" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={40} className="mx-auto mb-3" color="var(--ink-faint)" />
          <p className="text-sm" style={{color:'var(--ink)', opacity:0.4}}>{t.admin.orders.empty}</p>
        </div>
      ) : (
        <div className="rounded-[6px] overflow-hidden"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <div className="divide-y" style={{borderColor:'var(--line)'}}>
            {filtered.map(order => (
              <Link key={order.id} to={`/admin/commandes/${order.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{color:'var(--ink)'}}>{order.customer_name}</p>
                  <p className="text-xs mt-0.5" style={{color:'var(--ink)', opacity:0.4}}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{background:`${PAYMENT_COLORS[order.payment_status]}15`,
                      color:PAYMENT_COLORS[order.payment_status]}}>
                    {t.admin.orders.paymentStatuses[order.payment_status]}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{background:`${STATUS_COLORS[order.status]}15`,
                      color:STATUS_COLORS[order.status]}}>
                    {t.admin.orders.statuses[order.status as keyof typeof t.admin.orders.statuses]}
                  </span>
                  <span className="text-sm font-semibold ml-1" style={{color:'var(--ink)'}}>
                    {order.payment_amount?.toFixed(2)} €
                  </span>
                  <ChevronRight size={14} color="var(--ink-faint)" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
