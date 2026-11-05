// Edge Function: send-newsletter
// Envoie une campagne email marketing aux clients abonnés
// Appel : POST { subject, headline, body, ctaText, ctaUrl, products? }

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

  const { subject, headline, body, ctaText, ctaUrl, products, previewText } = await req.json()

  if (!subject || !headline) {
    return new Response(JSON.stringify({ ok: false, error: 'subject et headline requis' }), { status: 400, headers: CORS })
  }

  // Récupérer les abonnés newsletter
  const { data: subscribers } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('newsletter_opt_in', true)

  if (!subscribers?.length) {
    return new Response(JSON.stringify({ ok: false, error: 'Aucun abonné newsletter' }), { headers: CORS })
  }

  const productsHtml = products?.length ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        ${products.slice(0, 3).map((p: { name: string; brand: string; price: number; image?: string; url?: string }) => `
        <td width="33%" style="padding:0 10px;vertical-align:top;text-align:center;">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" width="160" style="width:100%;max-width:160px;display:block;margin:0 auto 14px;">` : ''}
          <div style="font-size:9px;color:#C8955A;text-transform:uppercase;letter-spacing:0.16em;font-family:-apple-system,sans-serif;">${p.brand}</div>
          <div style="font-size:13px;color:#28170E;font-weight:500;margin:5px 0 4px;line-height:1.4;font-family:-apple-system,sans-serif;">${p.name}</div>
          <div style="font-size:13px;color:#6B5D54;font-family:Georgia,serif;">${p.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          ${p.url ? `<a href="${p.url}" style="display:inline-block;margin-top:12px;font-size:10px;color:#28170E;text-decoration:none;border-bottom:1px solid #C8955A;padding-bottom:2px;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,sans-serif;">Découvrir</a>` : ''}
        </td>`).join('')}
      </tr>
    </table>` : ''

  const buildHtml = (recipientName: string) => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${previewText ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#EDE8E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE8E1;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#28170E;padding:44px 48px 36px;text-align:center;border-radius:4px 4px 0 0;">
          <img src="https://bks-store.com/images/brand/logo-bks-monogram.png" alt="BKS" height="60" style="height:60px;display:block;margin:0 auto;">
          <p style="color:#C8955A;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:16px 0 0;font-family:Georgia,serif;">Beau Kiosque de Soulier</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;">
          ${recipientName ? `<p style="color:#9E8E84;font-size:13px;margin:0 0 20px;font-family:-apple-system,sans-serif;">Bonjour ${recipientName},</p>` : ''}
          <h1 style="color:#28170E;font-size:30px;font-weight:400;margin:0 0 20px;line-height:1.3;font-family:Georgia,serif;">${headline}</h1>
          ${body ? `<div style="color:#6B5D54;font-size:15px;line-height:1.8;margin-bottom:32px;font-family:-apple-system,sans-serif;">${body}</div>` : ''}

          ${productsHtml}

          ${ctaText && ctaUrl ? `
          <div style="text-align:center;margin:36px 0 32px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;padding:16px 40px;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:-apple-system,sans-serif;">${ctaText}</a>
          </div>` : ''}

          <!-- Séparateur -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
            <tr><td style="border-top:1px solid #EDE8E1;"></td></tr>
          </table>

          <p style="color:#BFB5AE;font-size:11px;margin:0;line-height:1.75;font-family:-apple-system,sans-serif;">
            Vous recevez cet email car vous êtes abonné aux actualités BKS.<br>
            <a href="https://bks-store.com/desinscription" style="color:#C8955A;text-decoration:none;">Se désabonner</a>
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

  // Envoi en batch via Resend
  let sent = 0
  let errors = 0

  for (const sub of subscribers) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BKS <nouveautes@bks-store.com>',
        to: [sub.email],
        subject,
        html: buildHtml(sub.full_name?.split(' ')[0] ?? ''),
      }),
    })
    if (res.ok) sent++; else errors++
  }

  return new Response(
    JSON.stringify({ ok: true, sent, errors, total: subscribers.length }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
