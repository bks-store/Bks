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
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Black Friday — BKS Store</title>
</head>
<body style="margin:0;padding:0;background:#EDE8E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE8E1;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- En-tête BKS -->
        <tr><td style="background:#28170E;padding:36px 48px;text-align:center;border-radius:4px 4px 0 0;">
          <img src="https://bks-store.com/images/brand/logo-bks-monogram.png" alt="BKS" height="52" style="height:52px;display:block;margin:0 auto;">
          <p style="color:#C8955A;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:12px 0 0;font-family:-apple-system,sans-serif;font-weight:600;">Beau Kiosque de Soulier</p>
        </td></tr>

        <!-- Bandeau Black Friday -->
        <tr><td style="background:#1a0f09;padding:28px 48px;text-align:center;">
          <p style="color:#F4EFE6;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 10px;font-family:-apple-system,sans-serif;font-weight:600;">Black Friday</p>
          <p style="color:#F4EFE6;font-size:40px;font-weight:700;margin:0;line-height:1;font-family:Georgia,serif;">−${PROMO_PCT}%</p>
          <p style="color:#C8955A;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;margin:10px 0 0;font-family:-apple-system,sans-serif;">sur toute la boutique</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="background:#ffffff;padding:44px 48px;">
          <p style="font-size:22px;color:#28170E;margin:0 0 16px;font-family:Georgia,serif;line-height:1.3;">Votre code exclusif est arrivé.</p>
          <p style="font-size:14px;color:#6D5747;line-height:1.75;margin:0 0 32px;font-family:-apple-system,sans-serif;">
            Profitez de <strong style="color:#28170E;">−${PROMO_PCT}% sur l'ensemble de la boutique</strong> jusqu'au ${PROMO_EXPIRES}.<br>
            Entrez le code ci-dessous à l'étape panier pour en bénéficier.
          </p>

          <!-- Code promo encadré -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="border:2px dashed #C8955A;border-radius:6px;padding:20px 24px;text-align:center;background:#FBF8F3;">
              <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 8px;font-family:-apple-system,sans-serif;">Votre code promo</p>
              <p style="font-size:28px;font-weight:700;color:#28170E;letter-spacing:0.12em;margin:0;font-family:-apple-system,sans-serif;">${PROMO_CODE}</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="https://bks-store.com/catalogue" style="display:inline-block;background:#28170E;color:#F4EFE6;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;padding:16px 36px;border-radius:3px;font-family:-apple-system,sans-serif;">
                Découvrir la boutique →
              </a>
            </td></tr>
          </table>

          <p style="font-size:12px;color:#9E8E84;line-height:1.6;margin:0;font-family:-apple-system,sans-serif;">
            Ce code est valable jusqu'au <strong>${PROMO_EXPIRES}</strong>.
            Il s'applique sur l'ensemble des produits disponibles en stock.
            Non cumulable avec d'autres offres.
          </p>
        </td></tr>

        <!-- Pied de page -->
        <tr><td style="background:#28170E;padding:28px 48px;text-align:center;border-radius:0 0 4px 4px;">
          <p style="color:rgba(244,239,230,0.6);font-size:11px;margin:0 0 6px;font-family:-apple-system,sans-serif;">BKS Store · bks-store.com</p>
          <p style="color:rgba(244,239,230,0.3);font-size:10px;margin:0;font-family:-apple-system,sans-serif;">
            Vous recevez cet email car vous avez souscrit à notre offre Black Friday.<br>
            Pour vous désinscrire, répondez à cet email avec "Désabonnement".
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
