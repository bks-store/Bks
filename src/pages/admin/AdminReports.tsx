import { useEffect, useState, useRef } from 'react'
import { supabase, isConfigured } from '../../lib/supabase'

const MARKUP = 1.65

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  payment_status: string
  payment_amount: number
  status: string
}

interface OrderItem {
  order_id: string
  product_name: string
  product_brand: string
  size: string
  quantity: number
  unit_price: number
  unit_price_buy: number | null
}

interface MonthData {
  key: string
  label: string
  orders: Order[]
  items: OrderItem[]
  ca: number
  marge: number
  nbOrders: number
}

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function AdminReports() {
  const [months, setMonths] = useState<MonthData[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const load = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_name, product_brand, size, quantity, unit_price, unit_price_buy') as { data: OrderItem[] | null }

      const ordersData: Order[] = orders ?? []
      const itemsData: OrderItem[] = items ?? []

      const map: Record<string, MonthData> = {}
      for (const o of ordersData) {
        const key = monthKey(o.created_at)
        if (!map[key]) map[key] = { key, label: monthLabel(key), orders: [], items: [], ca: 0, marge: 0, nbOrders: 0 }
        map[key].orders.push(o)
        map[key].ca += o.payment_amount ?? 0
        map[key].nbOrders++
      }

      for (const item of itemsData) {
        const order = ordersData.find(o => o.id === item.order_id)
        if (!order) continue
        const key = monthKey(order.created_at)
        if (!map[key]) continue
        map[key].items.push(item)
        const buy = item.unit_price_buy ?? item.unit_price / MARKUP
        map[key].marge += (item.unit_price - buy) * (item.quantity ?? 1)
      }

      const sorted = Object.values(map).sort((a, b) => b.key.localeCompare(a.key))
      setMonths(sorted)
      if (sorted.length > 0) setSelected(sorted[0].key)
      setLoading(false)
    }
    load()
  }, [])

  const month = months.find(m => m.key === selected)

  const handlePrint = () => {
    if (!month) return
    const printContent = printRef.current?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bilan BKS — ${month.label}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, Georgia, serif; color: #1a1a1a; padding: 40px 48px; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #28170E; }
          .header img { height: 48px; }
          .header-right { text-align: right; }
          .header-right h1 { font-size: 1.25rem; font-weight: 600; color: #28170E; text-transform: uppercase; letter-spacing: 0.08em; }
          .header-right p { font-size: 0.8rem; color: #666; margin-top: 2px; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .kpi { background: #F4EFE6; border-radius: 8px; padding: 14px 16px; }
          .kpi__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 4px; }
          .kpi__value { font-size: 1.3rem; font-weight: 700; color: #28170E; }
          .section-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 12px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
          th { text-align: left; padding: 8px 10px; background: #28170E; color: #F4EFE6; font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 8px 10px; border-bottom: 1px solid #e8e0d5; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) td { background: #faf8f5; }
          .items-table { margin-top: 8px; margin-left: 16px; font-size: 0.75rem; }
          .items-table td { padding: 4px 8px; color: #444; border-bottom: 1px solid #f0ebe4; }
          .text-right { text-align: right; }
          .total-row { font-weight: 700; background: #F4EFE6 !important; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e0d5; display: flex; justify-content: space-between; font-size: 0.7rem; color: #999; }
          @media print { body { padding: 20px 24px; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--a-fg-soft)' }}>Chargement…</div>

  if (!isConfigured) return (
    <div style={{ padding: '2rem', color: 'var(--a-fg-soft)' }}>
      Rapports disponibles uniquement avec Supabase configuré.
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--a-fg)', marginBottom: '0.25rem' }}>Rapports mensuels</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--a-fg-soft)' }}>Bilans des commandes payées par mois</p>
        </div>
        {month && (
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Exporter PDF — {month.label}
          </button>
        )}
      </div>

      {months.length === 0 ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--a-fg-soft)' }}>
          Aucune commande payée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Sidebar mois */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            {months.map(m => (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                  borderRadius: '8px', marginBottom: '0.375rem', border: 'none', cursor: 'pointer',
                  background: selected === m.key ? 'var(--a-bronze-dim)' : 'transparent',
                  color: selected === m.key ? 'var(--a-bronze)' : 'var(--a-fg-soft)',
                  fontWeight: selected === m.key ? 600 : 400,
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ textTransform: 'capitalize' }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.7 }}>{m.nbOrders} commande{m.nbOrders > 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>

          {/* Contenu mois */}
          {month && (
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Zone d'impression cachée visuellement */}
              <div ref={printRef} style={{ display: 'none' }}>
                <PrintReport month={month} />
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Chiffre d\'affaires', value: formatPrice(month.ca) },
                  { label: 'Marge brute', value: formatPrice(month.marge), sub: `${month.ca > 0 ? ((month.marge / month.ca) * 100).toFixed(1) : 0}%` },
                  { label: 'Commandes', value: String(month.nbOrders) },
                  { label: 'Panier moyen', value: month.nbOrders > 0 ? formatPrice(month.ca / month.nbOrders) : '—' },
                ].map(kpi => (
                  <div key={kpi.label} className="admin-card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--a-fg-soft)', marginBottom: '0.375rem' }}>{kpi.label}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--a-fg)' }}>{kpi.value}</div>
                    {kpi.sub && <div style={{ fontSize: '0.75rem', color: 'var(--a-bronze)', marginTop: '2px' }}>{kpi.sub} du CA</div>}
                  </div>
                ))}
              </div>

              {/* Liste commandes */}
              <div className="admin-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--a-line)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--a-fg-soft)', fontWeight: 600 }}>
                  Détail des commandes
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--a-surface-2)' }}>
                      {['Date', 'Client', 'Produits', 'Montant', 'Marge', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--a-fg-soft)', fontWeight: 600, borderBottom: '1px solid var(--a-line)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {month.orders.map(order => {
                      const orderItems = month.items.filter(i => i.order_id === order.id)
                      const orderMarge = orderItems.reduce((s, i) => {
                        const buy = i.unit_price_buy ?? i.unit_price / MARKUP
                        return s + (i.unit_price - buy) * (i.quantity ?? 1)
                      }, 0)
                      const margeRate = order.payment_amount > 0 ? (orderMarge / order.payment_amount) * 100 : 0
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--a-line)' }}>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--a-fg-soft)', whiteSpace: 'nowrap' }}>{formatDate(order.created_at)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--a-fg-soft)' }}>{order.customer_email}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {orderItems.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--a-fg-soft)', lineHeight: 1.6 }}>
                                {item.product_brand} {item.product_name} · T{item.size} × {item.quantity}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(order.payment_amount)}</td>
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--a-bronze)', fontWeight: 500 }}>{formatPrice(orderMarge)}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--a-fg-soft)', marginLeft: '4px' }}>({margeRate.toFixed(0)}%)</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(78,122,67,0.12)', color: '#4E7A43', fontWeight: 600 }}>Payée</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PrintReport({ month }: { month: MonthData }) {
  const margeRate = month.ca > 0 ? ((month.marge / month.ca) * 100).toFixed(1) : '0'
  return (
    <>
      <div className="header">
        <img src="/images/brand/logo-bks-monogram.png" alt="BKS" />
        <div className="header-right">
          <h1>Bilan mensuel</h1>
          <p style={{ textTransform: 'capitalize' }}>{month.label}</p>
          <p>Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="kpi__label">Chiffre d'affaires</div><div className="kpi__value">{formatPrice(month.ca)}</div></div>
        <div className="kpi"><div className="kpi__label">Marge brute</div><div className="kpi__value">{formatPrice(month.marge)}<span style={{ fontSize: '0.8rem', fontWeight: 400, marginLeft: '6px' }}>({margeRate}%)</span></div></div>
        <div className="kpi"><div className="kpi__label">Commandes</div><div className="kpi__value">{month.nbOrders}</div></div>
        <div className="kpi"><div className="kpi__label">Panier moyen</div><div className="kpi__value">{month.nbOrders > 0 ? formatPrice(month.ca / month.nbOrders) : '—'}</div></div>
      </div>

      <div className="section-title">Détail des commandes</div>
      <table>
        <thead>
          <tr><th>Date</th><th>Client</th><th>Articles</th><th className="text-right">Montant</th><th className="text-right">Marge</th></tr>
        </thead>
        <tbody>
          {month.orders.map(order => {
            const orderItems = month.items.filter(i => i.order_id === order.id)
            const orderMarge = orderItems.reduce((s, i) => {
              const buy = i.unit_price_buy ?? i.unit_price / MARKUP
              return s + (i.unit_price - buy) * (i.quantity ?? 1)
            }, 0)
            return (
              <tr key={order.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.created_at)}</td>
                <td><div>{order.customer_name}</div><div style={{ color: '#888', fontSize: '0.7rem' }}>{order.customer_email}</div></td>
                <td>
                  {orderItems.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '0.75rem', color: '#555' }}>
                      {item.product_brand} {item.product_name} · T{item.size} × {item.quantity} · {formatPrice(item.unit_price * item.quantity)}
                    </div>
                  ))}
                </td>
                <td className="text-right" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(order.payment_amount)}</td>
                <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{formatPrice(orderMarge)}</td>
              </tr>
            )
          })}
          <tr className="total-row">
            <td colSpan={3} style={{ fontWeight: 700, padding: '10px' }}>TOTAL {month.label.toUpperCase()}</td>
            <td className="text-right" style={{ fontWeight: 700 }}>{formatPrice(month.ca)}</td>
            <td className="text-right" style={{ fontWeight: 700 }}>{formatPrice(month.marge)}</td>
          </tr>
        </tbody>
      </table>

      <div className="footer">
        <span>BKS — Beau Kiosque de Soulier · 3 Rue de la Chaux, Dinan</span>
        <span>Document confidentiel — usage interne</span>
      </div>
    </>
  )
}
