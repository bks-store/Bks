import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { PRODUCTS, type Product } from '../data/products'
import type { ProductWithSizes } from '../types/database'

// Convert a Supabase row (with embedded sizes) to the local Product shape
function toProduct(db: ProductWithSizes): Product {
  return {
    id: db.id,
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
      .select('id,name,brand,price_sale,price_original,category,subcategory,images,description,is_new,is_featured,stock_type,tags,product_sizes(size,available)')
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
    setProducts(sorted.map(r => toProduct(r)))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return <Ctx.Provider value={{ products, loading, reload: load }}>{children}</Ctx.Provider>
}

export function useProducts() {
  return useContext(Ctx)
}
