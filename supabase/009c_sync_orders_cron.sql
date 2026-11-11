-- Cron : interroger GoldenSneakers toutes les 2h pour récupérer les numéros de suivi
-- et envoyer automatiquement l'email d'expédition aux clients.
-- À exécuter dans le SQL Editor de Supabase (une seule fois).

select cron.schedule(
  'sync-orders-tracking',
  '0 */2 * * *',   -- toutes les 2 heures
  $sync$
  select
    net.http_post(
      url    := (select value from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/sync-orders',
      headers := jsonb_build_object(
        'Content-Type',   'application/json',
        'Authorization',  'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body   := '{}'::jsonb
    )
  $sync$
);
