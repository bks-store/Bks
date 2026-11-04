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
    if (!gsToken) throw new Error('GOLDEN_SNEAKERS_TOKEN manquant dans les secrets Supabase')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

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
      throw new Error('Commande dropship déjà créée pour cette commande')
    }

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
        street: addr.line1,
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
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
