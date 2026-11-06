// Edge Function: send-shipping-email
// Envoie l'email de suivi d'expédition au client
// Appel : POST { order_id }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY manquant' }), { status: 500, headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { order_id } = await req.json()
  if (!order_id) return new Response(JSON.stringify({ ok: false, error: 'order_id requis' }), { status: 400, headers: CORS })

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(product_name, product_brand, size, quantity, unit_price)')
    .eq('id', order_id)
    .single()

  if (!order) return new Response(JSON.stringify({ ok: false, error: 'Commande introuvable' }), { status: 404, headers: CORS })
  if (!order.tracking_number) return new Response(JSON.stringify({ ok: false, error: 'Numéro de suivi manquant' }), { status: 400, headers: CORS })

  const locale = String(order.locale ?? 'fr') === 'en' ? 'en' : 'fr'
  const tr = locale === 'en' ? {
    banner: 'Your order is on its way',
    title: 'Your parcel has been shipped.',
    intro: (ref: string) => `Your order <strong style="color:#28170E;">#${ref}</strong> has just been shipped. Track it in real time with the link below.`,
    trackingLabel: 'Tracking number',
    trackBtn: 'Track my parcel →',
    trackUrl: (t: string) => `https://www.royalmail.com/track-your-item#/tracking-results/${t}`,
    summaryLabel: 'Order summary',
    sizeQty: (size: string, qty: number) => `Size ${size} · Qty ${qty}`,
    contact: 'Any questions? Reply to this email or write to us at',
    subject: (ref: string) => `Your order #${ref} is on its way — BKS`,
  } : {
    banner: 'Votre commande est en route',
    title: 'Votre colis est expédié.',
    intro: (ref: string) => `Votre commande <strong style="color:#28170E;">#${ref}</strong> vient d'être expédiée. Vous pouvez suivre votre colis en temps réel avec le lien ci-dessous.`,
    trackingLabel: 'Numéro de suivi',
    trackBtn: 'Suivre mon colis →',
    trackUrl: (t: string) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${t}`,
    summaryLabel: 'Rappel de votre commande',
    sizeQty: (size: string, qty: number) => `Pointure ${size} · Qté ${qty}`,
    contact: 'Des questions ? Répondez à cet email ou écrivez-nous à',
    subject: (ref: string) => `Votre commande #${ref} est en route — BKS`,
  }
  const fmtEur = (n: number) => n.toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' })

  const ref = String(order.id).slice(0, 8).toUpperCase()
  const tracking = order.tracking_number as string

  const html = `<!DOCTYPE html>
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
        <tr><td style="background:#4E7A43;padding:13px 48px;text-align:center;">
          <p style="color:#ffffff;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">${tr.banner}</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;">
          <h1 style="color:#28170E;font-size:28px;font-weight:400;margin:0 0 12px;line-height:1.3;font-family:Georgia,serif;">${tr.title}</h1>
          <p style="color:#6B5D54;font-size:15px;margin:0 0 36px;line-height:1.75;font-family:-apple-system,sans-serif;">
            ${tr.intro(ref)}
          </p>

          <!-- Tracking -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr><td style="border:1px solid #DDD5CB;border-radius:4px;padding:20px 24px;">
              <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 6px;font-family:-apple-system,sans-serif;">${tr.trackingLabel}</p>
              <p style="font-size:20px;color:#28170E;font-weight:400;margin:0 0 16px;letter-spacing:0.08em;font-family:Georgia,serif;">${tracking}</p>
              <a href="${tr.trackUrl(tracking)}" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;padding:13px 28px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:-apple-system,sans-serif;">${tr.trackBtn}</a>
            </td></tr>
          </table>

          <!-- Séparateur -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-top:1px solid #EDE8E1;"></td></tr>
          </table>

          <!-- Rappel articles -->
          <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 16px;font-family:-apple-system,sans-serif;">${tr.summaryLabel}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${(order.order_items as Array<{product_brand:string;product_name:string;size:string;quantity:number;unit_price:number}>).map(i => `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #EDE8E1;vertical-align:top;">
                <span style="font-size:10px;color:#C8955A;text-transform:uppercase;letter-spacing:0.12em;font-family:-apple-system,sans-serif;">${i.product_brand}</span><br>
                <strong style="color:#28170E;font-size:14px;font-weight:500;font-family:-apple-system,sans-serif;">${i.product_name}</strong><br>
                <span style="color:#9E8E84;font-size:12px;font-family:-apple-system,sans-serif;">${tr.sizeQty(i.size, i.quantity)}</span>
              </td>
              <td style="padding:12px 0;border-bottom:1px solid #EDE8E1;text-align:right;vertical-align:top;white-space:nowrap;">
                <span style="font-size:14px;font-weight:600;color:#28170E;font-family:-apple-system,sans-serif;">${fmtEur(i.unit_price * i.quantity)}</span>
              </td>
            </tr>`).join('')}
          </table>

          <p style="color:#9E8E84;font-size:13px;line-height:1.75;margin:0;font-family:-apple-system,sans-serif;">
            ${tr.contact} <a href="mailto:bks@bks-store.com" style="color:#C8955A;text-decoration:none;">bks@bks-store.com</a>
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BKS <commandes@bks-store.com>',
      reply_to: 'bks@bks-store.com',
      to: [String(order.customer_email)],
      subject: tr.subject(ref),
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ ok: false, error: err }), { status: 500, headers: CORS })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
