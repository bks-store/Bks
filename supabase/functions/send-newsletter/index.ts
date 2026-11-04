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
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        ${products.slice(0, 3).map((p: { name: string; brand: string; price: number; image?: string; url?: string }) => `
        <td width="33%" style="padding:0 8px;vertical-align:top;text-align:center;">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" width="160" style="width:100%;max-width:160px;border-radius:8px;margin-bottom:10px;">` : ''}
          <div style="font-size:11px;color:#C8955A;text-transform:uppercase;letter-spacing:0.08em;">${p.brand}</div>
          <div style="font-size:14px;color:#28170E;font-weight:600;margin:4px 0;">${p.name}</div>
          <div style="font-size:14px;color:#28170E;">${p.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          ${p.url ? `<a href="${p.url}" style="display:inline-block;margin-top:10px;font-size:12px;color:#C8955A;text-decoration:none;border:1px solid #C8955A;padding:5px 14px;border-radius:4px;">Voir</a>` : ''}
        </td>`).join('')}
      </tr>
    </table>` : ''

  const buildHtml = (recipientName: string) => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
</head>
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
        <tr><td style="padding:40px 40px 32px;">
          ${recipientName ? `<p style="color:#888;font-size:14px;margin:0 0 16px;">Bonjour ${recipientName},</p>` : ''}
          <h1 style="color:#28170E;font-size:26px;font-weight:700;margin:0 0 16px;line-height:1.3;">${headline}</h1>
          ${body ? `<div style="color:#555;font-size:15px;line-height:1.7;margin-bottom:24px;">${body}</div>` : ''}

          ${productsHtml}

          ${ctaText && ctaUrl ? `
          <div style="text-align:center;margin:28px 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.03em;">${ctaText}</a>
          </div>` : ''}

          <p style="color:#aaa;font-size:12px;margin:28px 0 0;line-height:1.6;">
            Vous recevez cet email car vous êtes abonné aux actualités BKS.<br>
            <a href="https://bks-store.com/desinscription" style="color:#C8955A;">Se désabonner</a>
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
