-- Ajoute le prix d'achat fournisseur dans les lignes de commande
-- Permet de calculer la marge brute réelle par commande
alter table order_items
  add column if not exists unit_price_buy numeric(10,2);
