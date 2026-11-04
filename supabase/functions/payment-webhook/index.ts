// Edge Function: payment-webhook
// Reçoit les événements Stripe, met à jour les commandes, envoie les emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return new Response('Signature manquante', { status: 400 })

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-04-10' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
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
    if (!orderId) return new Response('ok', { status: 200 })

    await supabase.from('orders').update({
      payment_status: 'paid',
      stripe_payment_id: pi.id,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId)

    // Récupérer la commande + articles pour l'email
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(product_name, product_brand, size, quantity, unit_price)')
      .eq('id', orderId)
      .single()

    if (order) {
      await sendConfirmationEmail(order)
    }

    console.log(`[payment-webhook] Commande ${orderId} → payée, email envoyé`)
  }

  // ── Paiement échoué ───────────────────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.order_id
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)
    }
  }

  return new Response('ok', { status: 200 })
})

// ── Email de confirmation commande ────────────────────────────────────────────
async function sendConfirmationEmail(order: Record<string, unknown>) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return

  const items = (order.order_items as Array<{
    product_brand: string; product_name: string; size: string; quantity: number; unit_price: number
  }>) ?? []

  const ref = String(order.id).slice(0, 8).toUpperCase()
  const total = Number(order.payment_amount ?? 0)
  const shipping = total >= 150 ? 0 : 5.90
  const subtotal = total - shipping

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e0d5;">
        <strong style="color:#28170E;">${i.product_brand} ${i.product_name}</strong><br>
        <span style="color:#888;font-size:13px;">Pointure ${i.size} · Qté ${i.quantity}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e0d5;text-align:right;font-weight:600;color:#28170E;white-space:nowrap;">
        ${(i.unit_price * i.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ebe4;font-family:-apple-system,Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe4;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#28170E;padding:32px 40px;text-align:center;">
          <img src="https://bks-puce.vercel.app/images/brand/logo-bks-monogram.png" alt="BKS" height="52" style="height:52px;">
          <p style="color:#C8955A;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:12px 0 0;font-family:Georgia,serif;">Beau Kiosque de Soulier</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:40px 40px 24px;">
          <h1 style="color:#28170E;font-size:24px;font-weight:700;margin:0 0 8px;">Merci pour votre commande !</h1>
          <p style="color:#666;font-size:15px;margin:0 0 24px;line-height:1.6;">
            Votre paiement a bien été accepté. Nous préparons votre commande et vous enverrons un email dès l'expédition.
          </p>

          <!-- Référence -->
          <div style="background:#F4EFE6;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Référence commande</span><br>
            <strong style="color:#28170E;font-size:18px;letter-spacing:0.04em;">#${ref}</strong>
          </div>

          <!-- Articles -->
          <h2 style="color:#28170E;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Votre commande</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            ${itemsHtml}
          </table>

          <!-- Totaux -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:6px 0;color:#888;font-size:14px;">Sous-total</td>
              <td style="padding:6px 0;text-align:right;font-size:14px;">${subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#888;font-size:14px;">Livraison</td>
              <td style="padding:6px 0;text-align:right;font-size:14px;">${shipping === 0 ? '<span style="color:#4E7A43;font-weight:600;">Offerte</span>' : shipping.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 6px;color:#28170E;font-size:16px;font-weight:700;border-top:2px solid #e8e0d5;">Total</td>
              <td style="padding:12px 0 6px;text-align:right;font-size:16px;font-weight:700;color:#28170E;border-top:2px solid #e8e0d5;">${total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          </table>

          <!-- Adresse -->
          ${order.shipping_address ? `
          <div style="background:#faf8f5;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Livraison</span><br>
            <span style="color:#28170E;font-size:14px;line-height:1.7;">
              ${(order.shipping_address as Record<string,string>).line1 ?? ''}<br>
              ${(order.shipping_address as Record<string,string>).zip ?? ''} ${(order.shipping_address as Record<string,string>).city ?? ''}, ${(order.shipping_address as Record<string,string>).country ?? 'FR'}
            </span>
          </div>` : ''}

          <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
            Des questions ? Répondez à cet email ou contactez-nous à <a href="mailto:bks@bks-store.com" style="color:#C8955A;">bks@bks-store.com</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#28170E;padding:24px 40px;text-align:center;">
          <p style="color:#C8955A;font-size:12px;margin:0 0 4px;letter-spacing:0.08em;text-transform:uppercase;">BKS — Beau Kiosque de Soulier</p>
          <p style="color:rgba(244,239,230,0.5);font-size:12px;margin:0;">3 Rue de la Chaux · Dinan · bks-store.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BKS <commandes@bks-store.com>',
      to: [String(order.customer_email)],
      subject: `Commande confirmée #${ref} — BKS`,
      html,
    }),
  })
}
