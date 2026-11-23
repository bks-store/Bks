-- Migration 011: table abonnés newsletter (popup Black Friday)
create table if not exists newsletter_subscribers (
  id              uuid        primary key default gen_random_uuid(),
  email           text        unique not null,
  source          text        not null default 'popup',
  rgpd_consent    boolean     not null default true,
  subscribed_at   timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- Insertion publique (via Edge Function avec service role uniquement)
-- Pas de policy select public : emails protégés
