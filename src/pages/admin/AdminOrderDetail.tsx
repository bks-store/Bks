import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbOrder, OrderStatus } from '../../types/database'
import SmartImage from '../../components/SmartImage'
import { IMAGES } from '../../config/images'

const DEMO_ORDER: any = {
  id: 'ord-001', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  customer_name: 'Jean Dupont', customer_email: 'jean@example.com', customer_phone: '+33 6 12 34 56 78',
  shipping_address: { line1: '12 rue du Commerce', city: 'Dinan', zip: '22100', country: 'France' },
  stripe_session_id: 'cs_test_xxx', stripe_payment_id: 'pi_xxx',
  payment_status: 'paid', payment_amount: 189.99, status: 'pending',
  shipping_method: 'colissimo', tracking_number: null, shipping_cost: 7.90, notes: null,
  order_items: [
    { id: 'item-001', order_id: 'ord-001', product_id: 'jordan-1-retro-high',
      product_name: 'Air Jordan 1 Retro High OG', product_brand: 'Jordan',
      size: '43', quantity: 1, unit_price: 189.99, stock_type: 'boutique',
      supplier_order_id: null, supplier_order_status: null }
  ],
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [tracking, setTracking] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!isConfigured) {
        setOrder(DEMO_ORDER)
        setStatus(DEMO_ORDER.status)
        setTracking(DEMO_ORDER.tracking_number ?? '')
        setNotes(DEMO_ORDER.notes ?? '')
        setLoading(false)
        return
      }
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id as string).single(),
        supabase.from('order_items').select('*').eq('order_id', id as string),
      ])
      const o = orderRes.data as unknown as DbOrder
      if (o) {
        setOrder({ ...o, order_items: itemsRes.data ?? [] })
        setStatus(o.status)
        setTracking(o.tracking_number ?? '')
        setNotes(o.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    if (isConfigured) {
      await (supabase as any).from('orders').update({ status, tracking_number: tracking || null, notes: notes || null }).eq('id', id)
    }
    setOrder((prev: any) => prev ? { ...prev, status, tracking_number: tracking || null, notes: notes || null } : prev)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" color="var(--bks-brun)" /></div>
  if (!order) return <div className="text-center py-20"><p style={{color:'var(--ink)', opacity:0.4}}>Commande introuvable</p></div>

  const inputStyle = { background:'var(--surface)', color:'var(--ink)', border:'1px solid var(--line-strong)' }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/commandes" className="w-9 h-9 rounded-[4px] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={18} color="var(--ink)" />
        </Link>
        <div>
          <p className="eyebrow">Ventes</p>
          <h1 className="admin-title">
            {t.admin.orders.detail}
          </h1>
          <p className="text-xs mt-0.5" style={{color:'var(--ink)', opacity:0.4}}>
            #{order.id.slice(0,8).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Client */}
        <div className="rounded-[6px] p-5" style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{color:'#8A5A30'}}>Client</h3>
          <p className="text-sm font-medium" style={{color:'var(--ink)'}}>{order.customer_name}</p>
          <p className="text-sm mt-1" style={{color:'var(--ink)', opacity:0.6}}>{order.customer_email}</p>
          {order.customer_phone && <p className="text-sm mt-0.5" style={{color:'var(--ink)', opacity:0.6}}>{order.customer_phone}</p>}
          {order.shipping_address && (
            <div className="mt-3 text-sm" style={{color:'var(--ink)', opacity:0.6}}>
              <p>{order.shipping_address.line1}</p>
              <p>{order.shipping_address.zip} {order.shipping_address.city}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          )}
        </div>

        {/* Paiement */}
        <div className="rounded-[6px] p-5" style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{color:'#8A5A30'}}>
            {t.admin.orders.payment}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{color:'var(--ink)', opacity:0.6}}>Statut paiement</span>
            <span className="text-sm font-semibold px-2 py-1 rounded-full"
              style={{background: order.payment_status === 'paid' ? 'rgba(78,122,67,0.14)' : 'rgba(138,90,48,0.12)',
                color: order.payment_status === 'paid' ? '#4E7A43' : '#8A5A30'}}>
              {(t.admin.orders.paymentStatuses as any)[order.payment_status]}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm" style={{color:'var(--ink)', opacity:0.6}}>Montant total</span>
            <span className="text-base font-bold" style={{color:'var(--ink)'}}>{order.payment_amount?.toFixed(2)} €</span>
          </div>
          {order.stripe_payment_id && (
            <p className="text-xs mt-2" style={{color:'var(--ink)', opacity:0.3}}>Stripe: {order.stripe_payment_id}</p>
          )}
        </div>

        {/* Articles */}
        <div className="rounded-[6px] p-5" style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{color:'#8A5A30'}}>
            {t.admin.orders.items}
          </h3>
          <div className="space-y-3">
            {(order.order_items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="media w-12 shrink-0 rounded-[4px]" style={{aspectRatio:'4 / 5'}}>
                  <SmartImage src={item.product_id ? IMAGES.products[item.product_id] : undefined} alt={item.product_name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color:'var(--ink)'}}>{item.product_name}</p>
                  <p className="text-xs" style={{color:'var(--ink)', opacity:0.5}}>
                    {item.product_brand} · T.{item.size} · ×{item.quantity}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.stock_type === 'boutique' ? 'bg-[#4E7A43]' : 'bg-[#8A5A30]'}`} />
                    <span className="text-xs" style={{color:'var(--ink)', opacity:0.35}}>{item.stock_type}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{color:'var(--ink)'}}>
                  {(item.unit_price * item.quantity).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mise à jour statut */}
        <form onSubmit={handleSave} className="rounded-[6px] p-5 space-y-4"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <h3 className="text-xs font-semibold tracking-wider uppercase" style={{color:'#8A5A30'}}>
            {t.admin.orders.updateStatus}
          </h3>

          <div>
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color:'#8A5A30'}}>Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}
              className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle}>
              {Object.entries(t.admin.orders.statuses).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color:'#8A5A30'}}>
              {t.admin.orders.tracking}
            </label>
            <input value={tracking} onChange={e => setTracking(e.target.value)}
              placeholder="Numéro de suivi Colissimo…"
              className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color:'#8A5A30'}}>
              {t.admin.orders.notes}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Notes internes…"
              className="w-full px-4 py-3 rounded-[4px] text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {saved && (
            <p className="text-sm py-2 px-3 rounded-[4px] flex items-center gap-2"
              style={{background:'rgba(78,122,67,0.14)', color:'#4E7A43'}}>
              <Check size={14} /> Enregistré
            </p>
          )}

          <button type="submit" disabled={saving}
            className="w-full btn-primary py-3.5 rounded-[4px] text-sm font-semibold tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {t.admin.orders.save}
          </button>
        </form>
      </div>
    </div>
  )
}
