import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY manquant' }), { status: 500, headers: CORS })

  const { name, email, message } = await req.json()
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ ok: false, error: 'Champs manquants' }), { status: 400, headers: CORS })
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#EDE8E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE8E1;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#28170E;padding:36px 48px;text-align:center;border-radius:4px 4px 0 0;">
          <img src="https://bks-store.com/images/brand/logo-bks-monogram.png" alt="BKS" height="52" style="height:52px;display:block;margin:0 auto;">
          <p style="color:#C8955A;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:12px 0 0;font-family:Georgia,serif;">Beau Kiosque de Soulier</p>
        </td></tr>
        <tr><td style="background:#C8955A;padding:11px 48px;text-align:center;">
          <p style="color:#28170E;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;margin:0;font-family:-apple-system,sans-serif;font-weight:600;">Nouveau message via le site</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:40px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="border:1px solid #DDD5CB;border-radius:4px;padding:16px 20px;">
                <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 4px;font-family:-apple-system,sans-serif;">De</p>
                <p style="font-size:16px;color:#28170E;margin:0;font-family:Georgia,serif;">${name}</p>
                <p style="font-size:13px;color:#C8955A;margin:4px 0 0;font-family:-apple-system,sans-serif;">${email}</p>
              </td>
            </tr>
          </table>
          <p style="font-size:10px;color:#9E8E84;text-transform:uppercase;letter-spacing:0.14em;margin:0 0 12px;font-family:-apple-system,sans-serif;">Message</p>
          <p style="font-size:14px;color:#28170E;line-height:1.75;margin:0;font-family:-apple-system,sans-serif;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </td></tr>
        <tr><td style="background:#28170E;padding:28px 48px;text-align:center;border-radius:0 0 4px 4px;">
          <p style="color:rgba(244,239,230,0.4);font-size:11px;margin:0;font-family:-apple-system,sans-serif;">bks-store.com · Répondez directement à cet email</p>
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
      from: 'BKS Site <commandes@bks-store.com>',
      reply_to: email,
      to: ['bks@bks-store.com'],
      subject: `Message de ${name} — BKS`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ ok: false, error: err }), { status: 500, headers: CORS })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
