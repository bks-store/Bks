import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { PRODUCTS, type Product } from '../data/products'
import type { ProductWithSizes } from '../types/database'

// Convert a Supabase row (with embedded sizes) to the local Product shape
function toProduct(db: ProductWithSizes): Product {
  return {
    id: db.id,
    slug: db.slug ?? undefined,
    name: db.name,
    brand: db.brand,
    price: db.price_sale,
    originalPrice: db.price_original ?? undefined,
    category: db.category,
    subcategory: db.subcategory ?? '',
    sizes: (db.product_sizes ?? []).map(s => ({ size: s.size, available: s.available })),
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

const CACHE_KEY = 'bks_products_v2'
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000

function readCache(): Product[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { at, products } = JSON.parse(raw) as { at: number; products: Product[] }
    return Date.now() - at < CACHE_MAX_AGE && products.length ? products : null
  } catch { return null }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(() => (isConfigured ? readCache() : null))
  const [products, setProducts] = useState<Product[]>(isConfigured ? cached ?? [] : PRODUCTS)
  const [loading, setLoading] = useState(isConfigured && !cached)

  const load = async () => {
    if (!isConfigured) {
      setProducts(PRODUCTS)
      setLoading(false)
      return
    }
    if (!readCache()) setLoading(true)
    const { data: rows } = await supabase
      .from('products')
      .select('id,slug,name,brand,price_sale,price_original,category,subcategory,images,description,is_new,is_featured,stock_type,tags,product_sizes(size,available)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (!rows || rows.length === 0) {
      setProducts(PRODUCTS.filter(p => p.stockType === 'dropshipping'))
      setLoading(false)
      return
    }

    const typed = rows as unknown as ProductWithSizes[]

    // Products with images first (Supabase storage), then by featured, then newest
    const sorted = [...typed].sort((a, b) => {
      const aImg = a.images?.[0]?.includes('supabase.co') ? 1 : 0
      const bImg = b.images?.[0]?.includes('supabase.co') ? 1 : 0
      if (bImg !== aImg) return bImg - aImg
      if (b.is_featured !== a.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
      return 0
    })
    const fresh = sorted.map(r => toProduct(r))
    setProducts(fresh)
    setLoading(false)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), products: fresh })) } catch {}
  }

  useEffect(() => { load() }, [])

  return <Ctx.Provider value={{ products, loading, reload: load }}>{children}</Ctx.Provider>
}

export function useProducts() {
  return useContext(Ctx)
}
