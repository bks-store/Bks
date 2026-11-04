import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { items, total, customer } = await req.json()

    if (!items?.length) throw new Error('Panier vide')
    if (!customer?.name || !customer?.email) throw new Error('Nom et email requis')
    if (!customer?.address?.city || !customer?.address?.zip || !customer?.address?.line1) {
      throw new Error('Adresse de livraison incomplète')
    }

    // Créer la commande (statut pending — paiement non encore confirmé)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone ?? null,
        shipping_address: {
          line1: customer.address.line1,
          line2: customer.address.line2 ?? null,
          city: customer.address.city,
          zip: customer.address.zip,
          country: customer.address.country ?? 'FR',
        },
        payment_status: 'pending',
        payment_amount: total,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderErr || !order) throw new Error(orderErr?.message ?? 'Erreur création commande')

    // Insérer les articles
    const orderItems = await Promise.all(
      items.map(async (item: CartItem) => {
        // Récupérer gs_size_id via product_id + size
        const { data: sizeRow } = await supabase
          .from('product_sizes')
          .select('gs_size_id')
          .eq('product_id', item.productId)
          .eq('size', item.size)
          .maybeSingle()

        return {
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          product_brand: item.brand,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.price,
          stock_type: 'dropshipping',
          gs_size_id: sizeRow?.gs_size_id ?? null,
        }
      }),
    )

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
    if (itemsErr) throw new Error(itemsErr.message)

    return new Response(
      JSON.stringify({ ok: true, orderId: order.id }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

interface CartItem {
  productId: string
  name: string
  brand: string
  price: number
  size: string
  quantity: number
}
