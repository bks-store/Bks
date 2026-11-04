-- 005_golden_sneakers.sql
-- Colonnes pour l'intégration Golden Sneakers

-- products : identifiant numérique GS
alter table products
  add column if not exists gs_product_id int unique;

-- product_sizes : données Golden Sneakers par taille
alter table product_sizes
  add column if not exists gs_size_id  int unique,   -- ID taille GS (pour les commandes dropship)
  add column if not exists size_eu     text,          -- taille EU (ex: "42")
  add column if not exists size_us     text,          -- taille US (ex: "9")
  add column if not exists price_buy   numeric(10,2), -- prix achat GS (offer_price)
  add column if not exists barcode     text;

-- orders : suivi commande dropship GS
alter table orders
  add column if not exists gs_dropship_order_id  text,
  add column if not exists gs_dropship_status    text default 'not_sent';

-- order_items : GS size_id pour le dropship
alter table order_items
  add column if not exists gs_size_id  int;
