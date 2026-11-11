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
        // 2. Interroger GS pour l'état de cette commande dropship
        const gsRes = await fetch(
          `${GS_API_BASE}/orders-dropship/${order.gs_dropship_order_id}/`,
          { headers: { Authorization: `Bearer ${gsToken}` } },
        )

        if (!gsRes.ok) {
          errors.push(`GS ${gsRes.status} pour commande ${order.gs_dropship_order_id}`)
          continue
        }

        const gsOrder = await gsRes.json()

        // 3. Mettre à jour le statut "En préparation" si GS confirme
        if (
          order.status === 'confirmed' &&
          gsOrder.status &&
          ['processing', 'preparing', 'in_progress', 'confirmed'].includes(String(gsOrder.status).toLowerCase())
        ) {
          await supabase
            .from('orders')
            .update({ status: 'preparing', updated_at: new Date().toISOString() })
            .eq('id', order.id)
        }

        // 4. Si GS a un numéro de suivi → mettre à jour + envoyer email client
        const tracking = gsOrder.tracking_number ?? gsOrder.tracking ?? gsOrder.waybill ?? null
        if (tracking) {
          await supabase
            .from('orders')
            .update({
              tracking_number: String(tracking),
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
