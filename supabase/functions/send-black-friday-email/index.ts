// Edge Function: send-black-friday-email
// Enregistre l'email (newsletter_subscribers) et envoie le code promo Black Friday
// Appel : POST { email, test?: boolean }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMO_CODE = 'BFBKS'
const PROMO_PCT  = 20
const PROMO_EXPIRES = '29 novembre 2024'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY manquant' }), { status: 500, headers: CORS })

  const body = await req.json()
  const email: string = (body.email ?? '').trim().toLowerCase()
  const isTest: boolean = body.test === true

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ ok: false, error: 'Email invalide' }), { status: 400, headers: CORS })
  }

  // Enregistrer l'abonné (sauf en mode test)
  if (!isTest) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email, source: 'black-friday-popup', rgpd_consent: true }, { onConflict: 'email' })
    if (error) console.error('newsletter_subscribers upsert:', error.message)
  }

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

        <!-- Hero Black Friday -->
        <tr><td style="background:#0E0906;padding:0;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px 48px 4px;text-align:center;">
              <p style="color:rgba(200,149,90,0.55);font-size:9px;letter-spacing:0.32em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">— Offre exclusive —</p>
            </td></tr>
            <tr><td style="padding:12px 48px 4px;text-align:center;">
              <p style="color:#F4EFE6;font-size:72px;font-weight:400;margin:0;line-height:1;font-family:Georgia,serif;letter-spacing:-0.02em;">&#x2212;${PROMO_PCT}%</p>
            </td></tr>
            <tr><td style="padding:8px 48px 8px;text-align:center;">
              <p style="color:#C8955A;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">Black Friday</p>
            </td></tr>
            <tr><td style="padding:0 48px 28px;text-align:center;">
              <p style="color:rgba(244,239,230,0.35);font-size:11px;letter-spacing:0.08em;margin:0;font-family:-apple-system,sans-serif;">sur toute la boutique &middot; jusqu'au ${PROMO_EXPIRES}</p>
            </td></tr>
            <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#C8955A 30%,#C8955A 70%,transparent);"></td></tr>
          </table>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;">
          <h1 style="color:#28170E;font-size:26px;font-weight:400;margin:0 0 14px;line-height:1.35;font-family:Georgia,serif;">Votre code exclusif est arriv&#xe9;.</h1>
          <p style="color:#6B5D54;font-size:14px;margin:0 0 36px;line-height:1.8;font-family:-apple-system,sans-serif;">
            Profitez de <strong style="color:#28170E;">&#x2212;${PROMO_PCT}% sur l'ensemble de la boutique</strong> jusqu'au ${PROMO_EXPIRES}.<br>
            Entrez le code ci-dessous dans votre panier pour en b&#xe9;n&#xe9;ficier.
          </p>

          <!-- Code promo -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
            <tr><td style="background:#FBF8F3;border-top:3px solid #C8955A;padding:24px;text-align:center;">
              <p style="font-size:9px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.22em;margin:0 0 10px;font-family:-apple-system,sans-serif;font-weight:600;">Votre code promo</p>
              <p style="font-size:34px;font-weight:700;color:#28170E;letter-spacing:0.14em;margin:0 0 10px;font-family:-apple-system,sans-serif;">${PROMO_CODE}</p>
              <p style="font-size:11px;color:#C8955A;margin:0;font-family:-apple-system,sans-serif;letter-spacing:0.06em;">&#192; saisir dans le panier &middot; &#x2212;${PROMO_PCT}% sur tout</p>
            </td></tr>
          </table>

          <!-- S&#xe9;parateur -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="border-top:1px solid #EDE8E1;"></td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="https://bks-store.com/inscription" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;padding:15px 36px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;font-family:-apple-system,sans-serif;">Cr&#xe9;er mon compte &#x2192;</a>
            </td></tr>
          </table>

          <p style="font-size:11px;color:#B0A49C;line-height:1.65;margin:0;font-family:-apple-system,sans-serif;text-align:center;">
            Valable jusqu'au ${PROMO_EXPIRES} &middot; Sur l'ensemble des produits en stock &middot; Non cumulable
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#28170E;padding:32px 48px;text-align:center;border-radius:0 0 4px 4px;">
          <p style="color:#C8955A;font-size:10px;margin:0 0 8px;letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,serif;">BKS &#x2014; Beau Kiosque de Soulier</p>
          <p style="color:rgba(244,239,230,0.35);font-size:10px;margin:0 0 12px;font-family:-apple-system,sans-serif;letter-spacing:0.04em;">bks-store.com</p>
          <p style="color:rgba(244,239,230,0.2);font-size:10px;margin:0;font-family:-apple-system,sans-serif;line-height:1.6;">
            Vous recevez cet email car vous avez souscrit &#xe0; notre offre Black Friday.<br>
            Pour vous d&#xe9;sinscrire, r&#xe9;pondez avec "D&#xe9;sabonnement".
          </p>
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
      from: 'BKS Store <commandes@bks-store.com>',
      to: [email],
      subject: `Votre code Black Friday −${PROMO_PCT}% — BKS Store`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Erreur envoi email' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
