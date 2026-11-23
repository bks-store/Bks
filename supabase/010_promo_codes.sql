-- Migration 010: table codes promo
create table if not exists promo_codes (
  id              uuid        primary key default gen_random_uuid(),
  code            text        unique not null,
  discount_percent integer    not null check (discount_percent > 0 and discount_percent <= 100),
  max_uses        integer,
  used_count      integer     not null default 0,
  active          boolean     not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

alter table promo_codes enable row level security;

-- Lecture publique : uniquement les codes valides (actif, non expiré, pas épuisé)
-- Le front peut vérifier un code sans exposer les codes inactifs
create policy "read valid codes" on promo_codes
  for select using (
    active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or used_count < max_uses)
  );

-- Fonction pour incrémenter used_count (appelée depuis la Edge Function avec service role)
create or replace function increment_promo_used(code_input text)
returns void language sql security definer as $$
  update promo_codes set used_count = used_count + 1 where code = code_input;
$$;

-- Code Black Friday 20%
insert into promo_codes (code, discount_percent, active, expires_at)
values ('BFBKS', 20, true, '2026-11-29 22:59:00+00')
on conflict (code) do nothing;
