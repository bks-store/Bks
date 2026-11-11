-- Migration : ajout de slugs SEO sur les produits
-- À exécuter dans Supabase → SQL Editor

CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Ajouter la colonne slug
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;

-- 2. Générer les slugs depuis brand + name (ex: "Jordan 4 Retro London" → "jordan-4-retro-london")
UPDATE products
SET slug = lower(
  trim('-' FROM
    regexp_replace(
      unaccent(brand || '-' || name),
      '[^a-z0-9]+',
      '-',
      'gi'
    )
  )
)
WHERE slug IS NULL;

-- 3. Rendre les slugs uniques si doublons (ajoute -2, -3 etc.)
WITH duplicates AS (
  SELECT id, slug,
    row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM products
  WHERE slug IS NOT NULL
)
UPDATE products p
SET slug = d.slug || '-' || d.rn
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- 4. Index unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
