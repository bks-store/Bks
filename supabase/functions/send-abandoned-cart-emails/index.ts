// Edge Function: send-abandoned-cart-emails
// Cherche les commandes non payées depuis 24h et envoie un email de rappel
// Appelée toutes les heures via pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return new Response('RESEND_API_KEY manquant', { status: 500 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Commandes pending depuis entre 55min et 65min, sans email envoyé, avec email client
  const cutoffMin = new Date(Date.now() - 65 * 60 * 1000).toISOString()
  const cutoffMax = new Date(Date.now() - 55 * 60 * 1000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(product_id, product_name, product_brand, size, quantity, unit_price)')
    .eq('payment_status', 'pending')
    .is('abandoned_email_sent_at', null)
    .gte('created_at', cutoffMin)
    .lte('created_at', cutoffMax)
    .not('customer_email', 'is', null)

  if (error) {
    console.error('[abandoned-cart] Erreur requête:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!orders?.length) {
    console.log('[abandoned-cart] Aucun panier à relancer')
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  let sent = 0
  for (const order of orders) {
    const locale = String(order.locale ?? 'fr') === 'en' ? 'en' : 'fr'
    const items = order.order_items as Array<{
      product_id: string; product_name: string; product_brand: string
      size: string; quantity: number; unit_price: number
    }>
    if (!items?.length) continue

    const html = buildEmail(order, items, locale)
    const subject = locale === 'en'
      ? 'Your BKS cart is waiting for you 🛒'
      : 'Votre panier BKS vous attend'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BKS <commandes@bks-store.com>',
        reply_to: 'bks@bks-store.com',
        to: [String(order.customer_email)],
        subject,
        html,
      }),
    })

    if (res.ok) {
      await supabase
        .from('orders')
        .update({ abandoned_email_sent_at: new Date().toISOString() })
        .eq('id', order.id)
      sent++
      console.log(`[abandoned-cart] Email envoyé à ${order.customer_email}`)
    } else {
      console.error(`[abandoned-cart] Échec envoi à ${order.customer_email}:`, await res.text())
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})

function buildEmail(
  order: Record<string, unknown>,
  items: Array<{ product_id: string; product_name: string; product_brand: string; size: string; quantity: number; unit_price: number }>,
  locale: 'fr' | 'en',
) {
  const name = String(order.customer_name ?? '').split(' ')[0] || (locale === 'en' ? 'there' : '')
  const total = Number(order.payment_amount ?? 0)
  const fmtEur = (n: number) => n.toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' })

  const tr = locale === 'en' ? {
    greeting: name ? `Hi ${name},` : 'Hi,',
    title: 'You left something behind.',
    body: 'Your cart is patiently waiting. The sneakers you selected are still available — but stock moves fast.',
    cta: 'Complete my purchase',
    itemsLabel: 'Your selection',
    sizeLabel: (s: string) => `Size ${s}`,
    totalLabel: 'Total',
    footer: 'No pressure — this is just a friendly reminder. If you have any questions, reply to this email.',
    ctaUrl: 'https://www.bks-store.com/catalogue',
  } : {
    greeting: name ? `Bonjour ${name},` : 'Bonjour,',
    title: 'Vous avez oublié quelque chose.',
    body: 'Votre panier vous attend sagement. Les sneakers que vous avez sélectionnées sont encore disponibles — mais les stocks bougent vite.',
    cta: 'Finaliser ma commande',
    itemsLabel: 'Votre sélection',
    sizeLabel: (s: string) => `Pointure ${s}`,
    totalLabel: 'Total',
    footer: 'Pas de pression — c\'est juste un petit rappel amical. Pour toute question, répondez à cet email.',
    ctaUrl: 'https://www.bks-store.com/catalogue',
  }

  const itemsHtml = items.slice(0, 3).map(i => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #EDE8E1;vertical-align:top;">
        <span style="font-size:10px;color:#C8955A;text-transform:uppercase;letter-spacing:0.12em;font-family:-apple-system,sans-serif;">${i.product_brand}</span><br>
        <strong style="color:#28170E;font-size:14px;font-weight:500;font-family:-apple-system,sans-serif;">${i.product_name}</strong><br>
        <span style="color:#9E8E84;font-size:12px;font-family:-apple-system,sans-serif;">${tr.sizeLabel(i.size)} · ×${i.quantity}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #EDE8E1;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-size:14px;font-weight:600;color:#28170E;font-family:-apple-system,sans-serif;">${fmtEur(i.unit_price * i.quantity)}</span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="${locale}">
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

        <!-- Bandeau -->
        <tr><td style="background:#C8955A;padding:14px 48px;text-align:center;">
          <p style="color:#28170E;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">🛒 ${tr.itemsLabel}</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;">
          <p style="font-size:14px;color:#9E8E84;margin:0 0 8px;font-family:-apple-system,sans-serif;">${tr.greeting}</p>
          <h1 style="color:#28170E;font-size:28px;font-weight:400;margin:0 0 16px;line-height:1.3;font-family:Georgia,serif;">${tr.title}</h1>
          <p style="color:#6B5D54;font-size:15px;margin:0 0 36px;line-height:1.75;font-family:-apple-system,sans-serif;">${tr.body}</p>

          <!-- Articles -->
          <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 16px;font-family:-apple-system,sans-serif;">${tr.itemsLabel}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
            ${itemsHtml}
          </table>

          <!-- Total -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;border-top:1px solid #EDE8E1;">
            <tr>
              <td style="padding:16px 0 6px;color:#28170E;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;">${tr.totalLabel}</td>
              <td style="padding:16px 0 6px;text-align:right;font-size:16px;font-weight:600;color:#28170E;font-family:-apple-system,sans-serif;">${fmtEur(total)}</td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr><td align="center">
              <a href="${tr.ctaUrl}" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;padding:16px 40px;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:-apple-system,sans-serif;border-radius:2px;">${tr.cta} →</a>
            </td></tr>
          </table>

          <p style="color:#9E8E84;font-size:12px;line-height:1.75;margin:0;font-family:-apple-system,sans-serif;">${tr.footer}</p>
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
}
