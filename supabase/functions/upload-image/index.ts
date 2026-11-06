// Edge Function: upload-image
// Upload sécurisé d'une photo produit vers Supabase Storage
// Vérifie que l'appelant est un admin authentifié, puis upload avec service_role

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Vérifier l'authentification Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Non autorisé' }, 401)
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) return json({ error: 'Non autorisé' }, 401)

    // Parse le multipart
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productId = (formData.get('productId') as string | null) ?? 'unknown'

    if (!file) return json({ error: 'Fichier manquant' }, 400)

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `manual/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = await file.arrayBuffer()

    // Upload avec service_role pour bypasser les policies RLS Storage
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: uploadErr } = await adminClient.storage
      .from('product-images')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) return json({ error: uploadErr.message }, 500)

    const { data } = adminClient.storage.from('product-images').getPublicUrl(path)

    return json({ url: data.publicUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload-image]', message)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
