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
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body       := '{}'::jsonb
  ) AS request_id;
  $$
);
