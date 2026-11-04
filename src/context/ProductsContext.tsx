import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { PRODUCTS, type Product } from '../data/products'
import type { DbProduct, DbProductSize } from '../types/database'

// Convert a Supabase row (+ its sizes) to the local Product shape
function toProduct(db: DbProduct, sizes: DbProductSize[]): Product {
  return {
    id: db.id,
    name: db.name,
    brand: db.brand,
    price: db.price_sale,
    originalPrice: db.price_original ?? undefined,
    category: db.category,
    subcategory: db.subcategory ?? '',
    sizes: sizes.map(s => ({ size: s.size, available: s.available })),
    images: db.images,
    description: db.description ?? '',
    isNew: db.is_new,
    isFeatured: db.is_featured,
    stockType: db.stock_type,
    tags: db.tags,
  }
}

interface ProductsCtx {
  products: Product[]
  loading: boolean
  reload: () => Promise<void>
}

const Ctx = createContext<ProductsCtx>({
  products: PRODUCTS,
  loading: false,
  reload: async () => {},
})

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(isConfigured ? [] : PRODUCTS)
  const [loading, setLoading] = useState(isConfigured)

  const load = async () => {
    if (!isConfigured) {
      setProducts(PRODUCTS)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: rows } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (!rows || rows.length === 0) {
      // Fallback : montrer uniquement les produits dropshipping (commandes en ligne)
      setProducts(PRODUCTS.filter(p => p.stockType === 'dropshipping'))
      setLoading(false)
      return
    }

    const ids = rows.map((r: DbProduct) => r.id)
    const { data: sizeRows } = await supabase
      .from('product_sizes')
      .select('*')
      .in('product_id', ids)

    const sizesByProduct = new Map<string, DbProductSize[]>()
    for (const s of (sizeRows ?? []) as DbProductSize[]) {
      const arr = sizesByProduct.get(s.product_id) ?? []
      arr.push(s)
      sizesByProduct.set(s.product_id, arr)
    }

    setProducts(rows.map((r: DbProduct) => toProduct(r, sizesByProduct.get(r.id) ?? [])))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return <Ctx.Provider value={{ products, loading, reload: load }}>{children}</Ctx.Provider>
}

export function useProducts() {
  return useContext(Ctx)
}
