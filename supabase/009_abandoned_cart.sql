-- Migration : colonne pour tracking email panier abandonné
-- À exécuter dans Supabase → SQL Editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS abandoned_email_sent_at timestamptz;

-- Index pour la requête de la cron job (commandes pending > 24h sans email envoyé)
CREATE INDEX IF NOT EXISTS idx_orders_abandoned
  ON orders (payment_status, created_at, abandoned_email_sent_at)
  WHERE payment_status = 'pending';
