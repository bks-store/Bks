-- ============================================================
-- BKS — Schéma Supabase
-- À exécuter dans l'éditeur SQL Supabase (Project > SQL Editor)
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- PRODUITS
-- ============================================================
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Identité
  name          text not null,
  brand         text not null,
  sku           text unique,                    -- référence interne ou fournisseur
  supplier_id   text,                           -- identifiant côté fournisseur (futur)

  -- Catégorisation
  category      text not null check (category in ('sneakers','streetwear','accessoires')),
  subcategory   text,
  tags          text[] default '{}',

  -- Prix
  price_sale    numeric(10,2) not null,         -- prix de vente affiché TTC
  price_buy     numeric(10,2),                  -- prix d'achat fournisseur (masqué coté front)
  price_original numeric(10,2),                 -- prix barré (promo)

  -- Contenu
  description   text,
  images        text[] default '{}',            -- URLs stockage Supabase / CDN

  -- Stock & logistique
  stock_type    text not null default 'boutique' check (stock_type in ('boutique','dropshipping','check')),
  is_published  boolean not null default false,
  is_featured   boolean not null default false,
  is_new        boolean not null default false,

  -- Synchronisation fournisseur
  last_sync_at  timestamptz,
  sync_status   text default 'manual' check (sync_status in ('manual','synced','error','pending'))
);

-- ============================================================
-- TAILLES / VARIANTES
-- ============================================================
create table if not exists product_sizes (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  size        text not null,
  stock_qty   int not null default 0,           -- 0 = indisponible
  available   boolean generated always as (stock_qty > 0) stored,
  unique(product_id, size)
);

-- ============================================================
-- COMMANDES
-- ============================================================
create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Client
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,

  -- Adresse de livraison
  shipping_address jsonb,                        -- { line1, line2, city, zip, country }

  -- Paiement (Stripe)
  stripe_session_id   text unique,
  stripe_payment_id   text unique,
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','refunded')),
  payment_amount      numeric(10,2),

  -- Statut commande
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  shipping_method text default 'colissimo',
  tracking_number text,
  shipping_cost   numeric(10,2) default 0,

  -- Notes
  notes           text
);

-- ============================================================
-- LIGNES DE COMMANDE
-- ============================================================
create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,

  -- Snapshot au moment de la commande
  product_name  text not null,
  product_brand text not null,
  size          text not null,
  quantity      int not null default 1,
  unit_price    numeric(10,2) not null,
  stock_type    text not null default 'boutique',

  -- Dropshipping : suivi fournisseur séparé
  supplier_order_id     text,
  supplier_order_status text
);

-- ============================================================
-- ERREURS DE SYNCHRONISATION
-- ============================================================
create table if not exists sync_errors (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  product_id  uuid references products(id) on delete cascade,
  error_type  text,
  message     text,
  resolved    boolean default false
);

-- ============================================================
-- TRIGGER: updated_at auto
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Produits publics (lecture seule pour front)
alter table products enable row level security;
create policy "Public can read published products"
  on products for select
  using (is_published = true);

-- Tailles publiques
alter table product_sizes enable row level security;
create policy "Public can read sizes of published products"
  on product_sizes for select
  using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );

-- Commandes : seul l'admin (service_role) peut lire/écrire
alter table orders enable row level security;
alter table order_items enable row level security;
alter table sync_errors enable row level security;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================================
insert into products (name, brand, category, subcategory, price_sale, price_buy, description,
  stock_type, is_published, is_new, is_featured, tags) values
(
  'Air Force 1 ''07 Low White', 'Nike', 'sneakers', 'Lifestyle',
  109.99, 72.00,
  'L''icône absolue. Tige en cuir véritable, amorti Air-Sole. Coloris blanc triple.',
  'boutique', true, true, true, array['nike','classique','blanc','cuir']
),
(
  'Air Jordan 1 Retro High OG', 'Jordan', 'sneakers', 'Basketball Heritage',
  189.99, 130.00,
  'Édition limitée, cuir premium. Ce modèle ne se trouve pas dans toutes les boutiques.',
  'boutique', true, true, true, array['jordan','retro','limited','high']
),
(
  'New Balance 550 Lifestyle', 'New Balance', 'sneakers', 'Lifestyle',
  129.99, 85.00,
  'Inspirée du basketball des années 90, elle allie style rétro et confort moderne.',
  'boutique', true, false, true, array['new-balance','retro','550']
),
(
  'Classic Mini II Boot', 'UGG', 'sneakers', 'Boots',
  159.99, 110.00,
  'Imperméable, chaleureux, intemporel.',
  'dropshipping', true, false, false, array['ugg','boot','hiver']
),
(
  'Gel-1130', 'ASICS', 'sneakers', 'Running Lifestyle',
  119.99, 79.00,
  'Amorti Gel légendaire et lignes des années 90.',
  'boutique', true, true, false, array['asics','gel','retro']
),
(
  'Air Max 90 Essential', 'Nike', 'sneakers', 'Air Max',
  149.99, 98.00,
  'Visible Air-Sole, mesh respirant, coloris iconique.',
  'dropshipping', true, false, true, array['nike','air-max','classique']
);
