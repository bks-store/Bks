import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GS_API_BASE = 'https://www.goldensneakers.net/api'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function alertShop(orderId: string, customer: string, message: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BKS Store <commandes@bks-store.com>',
      to: ['bks@bks-store.com'],
      subject: `⚠ Commande non transmise à Golden Sneakers — ${customer}`,
      html: `<p>La commande <strong>${orderId}</strong> (${customer}) est payée mais n'a pas pu être transmise à Golden Sneakers.</p>
<p>Erreur : <code>${message.replace(/</g, '&lt;')}</code></p>
<p>Il faut la passer manuellement chez Golden Sneakers, ou contacter le client.</p>`,
    }),
  }).catch(() => {})
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  let orderIdForAlert: string | null = null
  let customerForAlert = ''

  try {
    const gsToken = Deno.env.get('GOLDEN_SNEAKERS_TOKEN')
    if (!gsToken) throw new Error('GOLDEN_SNEAKERS_TOKEN manquant dans les secrets Supabase')

    const { order_id } = await req.json()
    if (!order_id) throw new Error('order_id manquant')

    // Récupérer la commande
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) throw new Error('Commande introuvable')
    if (order.payment_status !== 'paid') {
      throw new Error('Paiement non confirmé — impossible de créer la commande fournisseur')
    }
    if (order.gs_dropship_order_id) {
      return new Response(JSON.stringify({ ok: true, already: order.gs_dropship_order_id }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    orderIdForAlert = order.id
    customerForAlert = order.customer_name ?? ''

    const addr = order.shipping_address
    if (!addr) throw new Error('Adresse de livraison manquante')

    // Construire les items pour GS — utiliser gs_size_id via product_sizes
    const items: { size_id: number; quantity: number }[] = []

    for (const item of order.order_items) {
      if (!item.gs_size_id) {
        throw new Error(
          `Article "${item.product_name}" (taille ${item.size}) : gs_size_id manquant — vérifiez la synchronisation du catalogue`,
        )
      }
      items.push({ size_id: item.gs_size_id, quantity: item.quantity })
    }

    const body = {
      delivery_address: {
        name: order.customer_name,
        city: addr.city,
        zip_code: addr.zip,
        street: [addr.line1, addr.line2].filter((s: string | null) => s && s.trim()).join(', '),
        country_code: addr.country ?? 'FR',
        phone: order.customer_phone ?? '',
        email: order.customer_email,
      },
      client_provides_shipping_label: false,
      items,
    }

    const gsRes = await fetch(`${GS_API_BASE}/orders-dropship/create-order/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gsToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const gsData = await gsRes.json()
    if (!gsRes.ok) {
      throw new Error(`Golden Sneakers ${gsRes.status}: ${JSON.stringify(gsData)}`)
    }

    // Mettre à jour la commande avec l'ID dropship GS
    await supabase
      .from('orders')
      .update({
        gs_dropship_order_id: String(gsData.id ?? gsData.order_id ?? gsData.reference ?? ''),
        gs_dropship_status: 'sent',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({ ok: true, gs_order: gsData }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const message = (e as Error).message
    if (orderIdForAlert) {
      // 'error' empêche les relances automatiques et les alertes en boucle
      await supabase.from('orders')
        .update({ gs_dropship_status: 'error', notes: `Transmission GS échouée : ${message}`.slice(0, 500), updated_at: new Date().toISOString() })
        .eq('id', orderIdForAlert)
      await alertShop(orderIdForAlert, customerForAlert, message)
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
