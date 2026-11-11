-- Planifier l'envoi des emails paniers abandonnés toutes les heures
-- À exécuter dans Supabase → SQL Editor
-- (Remplace YOUR_SERVICE_ROLE_KEY par la clé dans Settings → API → service_role)

SELECT cron.schedule(
  'send-abandoned-cart-emails',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url        := 'https://kfkaejnkwcmyqeynlvme.supabase.co/functions/v1/send-abandoned-cart-emails',
    headers    := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2Flam5rd2NteXFleW5sdm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjk1NzMyOSwiZXhwIjoyMTA4NTMzMzI5fQ.ofwe7zbnun16-Lu-v-3QLuaIzER9n6MfZ8u6KP1OBGw'
    ),
    body       := '{}'::jsonb
  ) AS request_id;
  $$
);
