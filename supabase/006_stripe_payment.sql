-- Migration : colonnes Stripe sur la table orders
-- À exécuter dans Supabase → SQL Editor

-- Renommer mypos → stripe (si les colonnes mypos existent déjà)
alter table orders rename column if exists mypos_session_id to stripe_payment_intent_id;
alter table orders rename column if exists mypos_payment_id  to stripe_charge_id;

-- Ajouter les colonnes Stripe si elles n'existent pas encore
alter table orders
  add column if not exists stripe_payment_intent_id text unique,
  add column if not exists stripe_charge_id          text unique;

-- S'assurer que stripe_session_id et stripe_payment_id existent (schema original)
alter table orders
  add column if not exists stripe_session_id  text unique,
  add column if not exists stripe_payment_id  text unique;
