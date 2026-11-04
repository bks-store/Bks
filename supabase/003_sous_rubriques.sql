-- ============================================================
-- BKS — Sous-rubriques : ajout d'une hiérarchie parent/enfant
-- À exécuter dans Supabase > SQL Editor après 002_contenu_admin.sql
-- ============================================================

alter table rubriques
  add column if not exists parent_id uuid references rubriques(id) on delete set null;
