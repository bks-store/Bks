-- ============================================================
-- BKS — Contenu géré depuis l'admin : rubriques, photos, galerie
-- À exécuter après schema.sql (Supabase > SQL Editor).
-- ============================================================

-- ------------------------------------------------------------
-- Administrateurs autorisés à modifier le contenu.
-- Après avoir créé le compte de Damien (Authentication > Users),
-- ajoutez son identifiant :
--   insert into admin_users (user_id) values ('<uuid du compte>');
-- Pensez aussi à désactiver les inscriptions publiques
-- (Authentication > Providers > Email > "Allow new users to sign up").
-- ------------------------------------------------------------
create table if not exists admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;
create policy "Admins can read the admin list"
  on admin_users for select to authenticated
  using (user_id = auth.uid());

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from admin_users where user_id = auth.uid()) $$;

-- ------------------------------------------------------------
-- Rubriques
-- ------------------------------------------------------------
create table if not exists rubriques (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 300),
  cover_url text,
  rule_type text not null check (rule_type in ('brand', 'category', 'new', 'manual')),
  rule_value text,
  product_ids text[] not null default '{}',
  position integer not null default 0,
  is_visible boolean not null default true,
  in_menu boolean not null default true,
  on_home boolean not null default false
);
create trigger rubriques_updated_at before update on rubriques
  for each row execute function update_updated_at();

alter table rubriques enable row level security;
create policy "Public reads visible rubriques"
  on rubriques for select using (is_visible or is_admin());
create policy "Admins manage rubriques"
  on rubriques for all to authenticated using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Photos des emplacements du site (hero, boutique, Instagram…)
-- ------------------------------------------------------------
create table if not exists site_media (
  key text primary key check (key in (
    'hero', 'brand', 'store', 'about',
    'instagram-1', 'instagram-2', 'instagram-3', 'instagram-4', 'instagram-5', 'instagram-6'
  )),
  url text not null,
  updated_at timestamptz not null default now()
);
alter table site_media enable row level security;
create policy "Public reads site media" on site_media for select using (true);
create policy "Admins manage site media"
  on site_media for all to authenticated using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Galerie de la boutique
-- ------------------------------------------------------------
create table if not exists store_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null,
  caption text check (char_length(caption) <= 200),
  position integer not null default 0
);
alter table store_photos enable row level security;
create policy "Public reads store photos" on store_photos for select using (true);
create policy "Admins manage store photos"
  on store_photos for all to authenticated using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Stockage des photos (lecture publique, écriture admin)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public reads site-media files"
  on storage.objects for select using (bucket_id = 'site-media');
create policy "Admins upload site-media files"
  on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and is_admin());
create policy "Admins update site-media files"
  on storage.objects for update to authenticated using (bucket_id = 'site-media' and is_admin());
create policy "Admins delete site-media files"
  on storage.objects for delete to authenticated using (bucket_id = 'site-media' and is_admin());

-- ------------------------------------------------------------
-- Rubriques de départ (modifiables ensuite depuis l'admin)
-- ------------------------------------------------------------
insert into rubriques (slug, name, description, cover_url, rule_type, rule_value, position, in_menu, on_home) values
  ('sneakers', 'Sneakers', 'Jordan, Air Max, New Balance, ASICS', '/images/categories/sneakers.jpg', 'category', 'sneakers', 0, true, true),
  ('streetwear', 'Streetwear', 'Vestes, sweats et pièces de caractère', '/images/categories/streetwear.jpg', 'category', 'streetwear', 1, true, true),
  ('nouveautes', 'Nouveautés', 'Les derniers arrivages', '/images/categories/nouveautes.jpg', 'new', null, 2, false, true),
  ('nike', 'Nike', 'Air Force 1, Air Max, Dunk', '/images/products/air-max-90.jpg', 'brand', 'Nike', 3, true, false),
  ('accessoires', 'Accessoires', 'Entretien, chaussettes et petites pièces', null, 'category', 'accessoires', 4, true, false)
on conflict (slug) do nothing;
