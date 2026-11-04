// Edge Function: payment-webhook
// Reçoit les événements Stripe et met à jour le statut des commandes
// URL à configurer dans Stripe Dashboard → Developers → Webhooks
// Événements à écouter : payment_intent.succeeded, payment_intent.payment_failed

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Signature manquante', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-04-10',
  })

  // ── Vérifier la signature Stripe ─────────────────────────────────────────
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    console.error('[payment-webhook] Signature invalide:', err)
    return new Response('Signature invalide', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Paiement réussi ───────────────────────────────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.order_id

    if (!orderId) {
      console.warn('[payment-webhook] Pas d\'order_id dans les metadata du PaymentIntent')
      return new Response('ok', { status: 200 })
    }

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_payment_id: pi.id,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      console.error(`[payment-webhook] Erreur mise à jour commande ${orderId}:`, error.message)
      return new Response('Erreur base de données', { status: 500 })
    }

    console.log(`[payment-webhook] Commande ${orderId} → payée et confirmée`)

    // TODO Phase 2 : déclencher create-dropship-order pour les articles GS
  }

  // ── Paiement échoué ───────────────────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.order_id

    if (orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      console.log(`[payment-webhook] Commande ${orderId} → paiement échoué`)
    }
  }

  return new Response('ok', { status: 200 })
})
