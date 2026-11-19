-- Cron : interroger GoldenSneakers toutes les 2h pour récupérer les numéros de suivi
-- et envoyer automatiquement l'email d'expédition aux clients.
-- À exécuter dans le SQL Editor de Supabase (une seule fois).

SELECT cron.schedule(
  'sync-orders-tracking',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url        := 'https://kfkaejnkwcmyqeynlvme.supabase.co/functions/v1/sync-orders',
    headers    := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2Flam5rd2NteXFleW5sdm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjk1NzMyOSwiZXhwIjoyMTA4NTMzMzI5fQ.ofwe7zbnun16-Lu-v-3QLuaIzER9n6MfZ8u6KP1OBGw'
    ),
    body       := '{}'::jsonb
  ) AS request_id;
  $$
);
