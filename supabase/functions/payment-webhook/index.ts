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
      <td style="padding:14px 0;border-bottom:1px solid #EDE8E1;vertical-align:top;">
        <span style="font-size:10px;color:#C8955A;text-transform:uppercase;letter-spacing:0.12em;font-family:-apple-system,sans-serif;">${i.product_brand}</span><br>
        <strong style="color:#28170E;font-size:14px;font-weight:500;font-family:-apple-system,sans-serif;">${i.product_name}</strong><br>
        <span style="color:#9E8E84;font-size:12px;font-family:-apple-system,sans-serif;">Pointure ${i.size} · Qté ${i.quantity}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #EDE8E1;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-size:14px;font-weight:600;color:#28170E;font-family:-apple-system,sans-serif;">${(i.unit_price * i.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EDE8E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE8E1;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#28170E;padding:44px 48px 36px;text-align:center;border-radius:4px 4px 0 0;">
          <img src="https://bks-store.com/images/brand/logo-bks-monogram.png" alt="BKS" height="60" style="height:60px;display:block;margin:0 auto;">
          <p style="color:#C8955A;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:16px 0 0;font-family:Georgia,serif;">Beau Kiosque de Soulier</p>
        </td></tr>

        <!-- Bandeau confirmation -->
        <tr><td style="background:#C8955A;padding:14px 48px;text-align:center;">
          <p style="color:#28170E;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">Commande confirmée</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;">

          <!-- Intro -->
          <h1 style="color:#28170E;font-size:28px;font-weight:400;margin:0 0 12px;line-height:1.3;font-family:Georgia,serif;">Merci pour votre confiance.</h1>
          <p style="color:#6B5D54;font-size:15px;margin:0 0 36px;line-height:1.75;font-family:-apple-system,sans-serif;">
            Votre paiement a bien été reçu. Nous préparons votre commande avec soin et vous contacterons dès l'expédition.
          </p>

          <!-- Référence -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr>
              <td style="border:1px solid #DDD5CB;border-radius:4px;padding:20px 24px;">
                <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 6px;font-family:-apple-system,sans-serif;">Référence commande</p>
                <p style="font-size:22px;color:#28170E;font-weight:400;margin:0;letter-spacing:0.08em;font-family:Georgia,serif;">#${ref}</p>
              </td>
            </tr>
          </table>

          <!-- Séparateur -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-top:1px solid #EDE8E1;"></td></tr>
          </table>

          <!-- Articles -->
          <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 16px;font-family:-apple-system,sans-serif;">Détail de la commande</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            ${itemsHtml}
          </table>

          <!-- Totaux -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;border-top:1px solid #EDE8E1;">
            <tr>
              <td style="padding:10px 0 4px;color:#9E8E84;font-size:13px;font-family:-apple-system,sans-serif;">Sous-total</td>
              <td style="padding:10px 0 4px;text-align:right;font-size:13px;color:#28170E;font-family:-apple-system,sans-serif;">${subtotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#9E8E84;font-size:13px;font-family:-apple-system,sans-serif;">Livraison</td>
              <td style="padding:4px 0;text-align:right;font-size:13px;font-family:-apple-system,sans-serif;">${shipping === 0 ? '<span style="color:#5A8C4E;">Offerte</span>' : shipping.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 6px;color:#28170E;font-size:16px;font-weight:600;border-top:1px solid #DDD5CB;font-family:-apple-system,sans-serif;">Total</td>
              <td style="padding:16px 0 6px;text-align:right;font-size:16px;font-weight:600;color:#28170E;border-top:1px solid #DDD5CB;font-family:-apple-system,sans-serif;">${total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          </table>

          <!-- Adresse -->
          ${order.shipping_address ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr>
              <td style="background:#F9F6F2;border-radius:4px;padding:20px 24px;">
                <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 10px;font-family:-apple-system,sans-serif;">Adresse de livraison</p>
                <p style="color:#28170E;font-size:14px;line-height:1.75;margin:0;font-family:-apple-system,sans-serif;">
                  ${(order.shipping_address as Record<string,string>).line1 ?? ''}<br>
                  ${(order.shipping_address as Record<string,string>).zip ?? ''} ${(order.shipping_address as Record<string,string>).city ?? ''}<br>
                  ${(order.shipping_address as Record<string,string>).country ?? 'France'}
                </p>
              </td>
            </tr>
          </table>` : ''}

          <!-- Contact -->
          <p style="color:#9E8E84;font-size:13px;line-height:1.75;margin:0;font-family:-apple-system,sans-serif;">
            Une question sur votre commande ?<br>
            Répondez à cet email ou écrivez-nous à <a href="mailto:bks@bks-store.com" style="color:#C8955A;text-decoration:none;">bks@bks-store.com</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#28170E;padding:32px 48px;text-align:center;border-radius:0 0 4px 4px;">
          <p style="color:#C8955A;font-size:10px;margin:0 0 8px;letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,serif;">BKS — Beau Kiosque de Soulier</p>
          <p style="color:rgba(244,239,230,0.4);font-size:11px;margin:0;font-family:-apple-system,sans-serif;letter-spacing:0.04em;">3 Rue de la Chaux · Dinan, Bretagne · bks-store.com</p>
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
      reply_to: 'bks@bks-store.com',
      to: [String(order.customer_email)],
      subject: `Commande confirmée #${ref} — BKS`,
      html,
    }),
  })
}
