// Edge Function: sync-orders
// Interroge l'API GoldenSneakers toutes les 2h pour récupérer les numéros de suivi
// et envoie automatiquement l'email d'expédition aux clients dès que le colis part.
// Déclenché par pg_cron (voir 009c_sync_orders_cron.sql)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GS_API_BASE = 'https://www.goldensneakers.net/api'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const gsToken = Deno.env.get('GOLDEN_SNEAKERS_TOKEN')
    if (!gsToken) throw new Error('GOLDEN_SNEAKERS_TOKEN manquant')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Lecture seule : statuts bruts GS pour diagnostic (aucune écriture, aucun email)
    const body = await req.json().catch(() => ({}))
    if (Array.isArray(body?.inspect)) {
      const headers = { Authorization: `Bearer ${gsToken}` }
      const out: Record<string, unknown> = {}
      for (const gsId of (body.inspect as unknown[]).slice(0, 10).map(String)) {
        if (!/^\d+$/.test(gsId)) continue
        const o = await fetch(`${GS_API_BASE}/orders-dropship/order-details/${gsId}/`, { headers })
        const p = await fetch(`${GS_API_BASE}/orders-dropship/package-details/${gsId}/`, { headers })
        const oj = o.ok ? await o.json() : null
        const pj = p.ok ? await p.json() : null
        out[gsId] = {
          order_http: o.status,
          order_status: oj?.status ?? null,
          order_fields: oj ? Object.keys(oj) : null,
          package_http: p.status,
          package: pj,
        }
      }
      return new Response(JSON.stringify({ ok: true, inspect: out }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // 0. Relancer les commandes payées jamais transmises à GS (échec réseau au moment du paiement)
    const retried: string[] = []
    const { data: untransmitted } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid')
      .is('gs_dropship_order_id', null)
      .is('gs_dropship_status', null)
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    for (const o of untransmitted ?? []) {
      await fetch(`${supabaseUrl}/functions/v1/create-dropship-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: o.id }),
      }).catch(() => {})
      retried.push(o.id)
    }

    // 1. Trouver toutes les commandes envoyées à GS mais pas encore expédiées
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('id, gs_dropship_order_id, status, tracking_number')
      .not('gs_dropship_order_id', 'is', null)
      .in('status', ['confirmed', 'preparing'])

    if (error) throw new Error(`Lecture commandes: ${error.message}`)
    if (!pendingOrders?.length) {
      return new Response(JSON.stringify({ ok: true, checked: 0, shipped: 0, retried }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    let shippedCount = 0
    const errors: string[] = []
    const statuses: Record<string, string> = {}

    for (const order of pendingOrders) {
      try {
        const headers = { Authorization: `Bearer ${gsToken}` }
        const gsId = order.gs_dropship_order_id

        // 2a. Statut de la commande
        const orderRes = await fetch(`${GS_API_BASE}/orders-dropship/order-details/${gsId}/`, { headers })
        if (!orderRes.ok) {
          errors.push(`GS order-details ${orderRes.status} pour ${gsId}`)
          continue
        }
        const gsOrder = await orderRes.json()
        const gsStatus = String(gsOrder.status ?? '').toUpperCase()
        statuses[gsId] = gsStatus

        // GS attribue le numéro de suivi dès la commande (TO_SHIP) : seul ENDED signifie colis parti
        if (gsStatus === 'TO_SHIP') {
          if (order.status === 'confirmed') {
            await supabase
              .from('orders')
              .update({ status: 'preparing', updated_at: new Date().toISOString() })
              .eq('id', order.id)
          }
          continue
        }
        if (gsStatus !== 'ENDED') continue

        const tracking = gsOrder.tracking_numbers ?? gsOrder.tracking_number ?? gsOrder.waybill ?? null
        const trackingStr: string | null = Array.isArray(tracking)
          ? (tracking[0] ? String(tracking[0]) : null)
          : (tracking ? String(tracking) : null)

        if (!trackingStr && !order.tracking_number) {
          errors.push(`GS ${gsId} ENDED sans numéro de suivi`)
          continue
        }

        await supabase
          .from('orders')
          .update({
            tracking_number: order.tracking_number ?? trackingStr,
            status: 'shipped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        shippedCount++

        // Email d'expédition une seule fois : si un suivi était déjà enregistré, le client l'a déjà reçu
        if (!order.tracking_number && Deno.env.get('RESEND_API_KEY')) {
          const mailRes = await fetch(`${supabaseUrl}/functions/v1/send-shipping-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_id: order.id }),
          })
          if (!mailRes.ok) errors.push(`Email expédition ${order.id}: HTTP ${mailRes.status} ${(await mailRes.text()).slice(0, 200)}`)
        }
      } catch (e) {
        errors.push(`Exception commande ${order.id}: ${(e as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        checked: pendingOrders.length,
        shipped: shippedCount,
        gs_statuses: statuses,
        retried,
        errors,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
