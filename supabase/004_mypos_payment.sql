-- Migration : ajouter les colonnes myPOS à la table orders
-- À exécuter dans Supabase → SQL Editor

alter table orders
  add column if not exists mypos_session_id  text unique,
  add column if not exists mypos_payment_id  text unique;

-- Renommer les colonnes Stripe en colonnes génériques (optionnel si vous n'avez pas encore de données)
-- alter table orders rename column stripe_session_id to payment_session_id;
-- alter table orders rename column stripe_payment_id to payment_provider_id;
