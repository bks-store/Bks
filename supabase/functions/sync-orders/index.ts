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

    // 1. Trouver toutes les commandes envoyées à GS mais pas encore expédiées
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('id, gs_dropship_order_id, status, tracking_number')
      .not('gs_dropship_order_id', 'is', null)
      .is('tracking_number', null)
      .not('status', 'in', '("cancelled","delivered")')

    if (error) throw new Error(`Lecture commandes: ${error.message}`)
    if (!pendingOrders?.length) {
      return new Response(JSON.stringify({ ok: true, checked: 0, shipped: 0 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    let shippedCount = 0
    const errors: string[] = []

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

        // 3. Mettre à jour le statut "En préparation" si GS confirme (TO_SHIP)
        if (
          order.status === 'confirmed' &&
          String(gsOrder.status ?? '').toUpperCase() === 'TO_SHIP'
        ) {
          await supabase
            .from('orders')
            .update({ status: 'preparing', updated_at: new Date().toISOString() })
            .eq('id', order.id)
        }

        // 2b. Détails du colis (tracking)
        let gsPackage: Record<string, unknown> = {}
        const pkgRes = await fetch(`${GS_API_BASE}/orders-dropship/package-details/${gsId}/`, { headers })
        if (pkgRes.ok) gsPackage = await pkgRes.json()

        // 4. Si GS a un numéro de suivi → mettre à jour + envoyer email client
        const tracking =
          (gsPackage as Record<string, unknown>).tracking_numbers
            ?? gsPackage.tracking_number
            ?? gsOrder.tracking_numbers
            ?? gsOrder.tracking_number
            ?? gsOrder.waybill
            ?? null

        // tracking_numbers peut être un tableau → prendre le premier
        const trackingStr: string | null = Array.isArray(tracking)
          ? (tracking[0] ? String(tracking[0]) : null)
          : (tracking ? String(tracking) : null)

        if (trackingStr) {
          await supabase
            .from('orders')
            .update({
              tracking_number: trackingStr,
              status: 'shipped',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          // Déclencher l'email d'expédition (ne jamais appeler si RESEND non configuré)
          const resendKey = Deno.env.get('RESEND_API_KEY')
          if (resendKey) {
            await fetch(`${supabaseUrl}/functions/v1/send-shipping-email`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ order_id: order.id }),
            })
          }

          shippedCount++
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
