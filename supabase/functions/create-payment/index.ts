// Edge Function: create-payment
// Crée une commande Supabase + un PaymentIntent Stripe
// Retourne le client_secret pour Stripe Elements côté front

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
  productId: string
  name: string
  brand: string
  price: number
  size: string
  quantity: number
}

interface CheckoutPayload {
  items: CartItem[]
  total: number
  customer: {
    name: string
    email: string
    phone?: string
    address: {
      line1: string
      line2?: string
      city: string
      zip: string
      country: string
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const payload: CheckoutPayload = await req.json()
    const { items, total, customer } = payload

    if (!items?.length || !total || !customer?.name || !customer?.email) {
      return json({ error: 'Données manquantes' }, 400)
    }
    if (!customer?.address?.city || !customer?.address?.zip || !customer?.address?.line1) {
      return json({ error: 'Adresse de livraison incomplète' }, 400)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-04-10',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Créer la commande en base (pending) ────────────────────────────────
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

    // ── 2. Insérer les articles ───────────────────────────────────────────────
    const orderItems = await Promise.all(
      items.map(async (item) => {
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

    // ── 3. Créer le PaymentIntent Stripe ──────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),  // centimes
      currency: 'eur',
      metadata: { order_id: order.id },
      receipt_email: customer.email,
      description: `BKS Dinan — ${items.length} article(s)`,
      automatic_payment_methods: { enabled: true },
    })

    // Sauvegarder l'ID du PaymentIntent
    await supabase
      .from('orders')
      .update({ stripe_session_id: paymentIntent.id })
      .eq('id', order.id)

    return json({ clientSecret: paymentIntent.client_secret, orderId: order.id })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[create-payment]', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
