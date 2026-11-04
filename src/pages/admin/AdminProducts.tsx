import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Eye, EyeOff, Package, Loader2, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbProduct } from '../../types/database'
import { PRODUCTS } from '../../data/products'
import SmartImage from '../../components/SmartImage'
import { IMAGES } from '../../config/images'

// Conversion données locales -> DbProduct pour la démo
const DEMO_PRODUCTS: DbProduct[] = PRODUCTS.map(p => ({
  id: p.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  name: p.name,
  brand: p.brand,
  sku: null,
  supplier_id: null,
  category: p.category,
  subcategory: p.subcategory,
  tags: p.tags,
  price_sale: p.price,
  price_buy: p.price * 0.65,
  price_original: p.originalPrice ?? null,
  description: p.description,
  images: p.images,
  stock_type: p.stockType,
  is_published: true,
  is_featured: p.isFeatured,
  is_new: p.isNew,
  last_sync_at: null,
  sync_status: 'manual',
}))

export default function AdminProducts() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<DbProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const load = async () => {
    setLoading(true)
    if (!isConfigured) {
      setProducts(DEMO_PRODUCTS)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const syncCatalog = async () => {
    if (!isConfigured) {
      setSyncResult({ ok: false, msg: 'Supabase non configuré — mode démo.' })
      return
    }
    setSyncing(true)
    setSyncResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('sync-catalog', {
        body: {},
      })
      if (error) throw new Error(error.message)
      if (!data?.ok) throw new Error(data?.error ?? 'Erreur inconnue')
      setSyncResult({
        ok: true,
        msg: `${data.products_synced} produits, ${data.sizes_synced} tailles synchronisés.`,
      })
      await load()
    } catch (e) {
      setSyncResult({ ok: false, msg: (e as Error).message })
    } finally {
      setSyncing(false)
    }
  }

  const deleteProduct = async (product: DbProduct) => {
    if (!confirm(`Supprimer "${product.name}" ? Cette action est irréversible.`)) return
    setDeleting(product.id)
    if (isConfigured) {
      await (supabase as any).from('product_sizes').delete().eq('product_id', product.id)
      await (supabase as any).from('products').delete().eq('id', product.id)
    }
    setProducts(prev => prev.filter(p => p.id !== product.id))
    setDeleting(null)
  }

  const togglePublish = async (product: DbProduct) => {
    setToggling(product.id)
    if (isConfigured) {
      const client = supabase as unknown as { from: (t: string) => any }
      await client.from('products').update({ is_published: !product.is_published }).eq('id', product.id)
    }
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, is_published: !p.is_published } : p
    ))
    setToggling(null)
  }

  const brands = ['all', ...[...new Set(products.map(p => p.brand))].sort()]

  const filtered = products.filter(p => {
    const matchSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true :
      filter === 'published' ? p.is_published : !p.is_published
    const matchBrand = brandFilter === 'all' || p.brand === brandFilter
    return matchSearch && matchFilter && matchBrand
  }).sort((a, b) => {
    if (brandFilter !== 'all') return a.name.localeCompare(b.name)
    return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="admin-title">
            {t.admin.products.title}
          </h1>
          <p className="text-xs mt-1" style={{color:'var(--ink)', opacity:0.4}}>
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={syncCatalog}
            disabled={syncing}
            className="px-4 py-2.5 rounded-[4px] text-sm font-semibold flex items-center gap-2"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              opacity: syncing ? 0.6 : 1,
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
            title="Synchroniser le catalogue Golden Sneakers"
          >
            {syncing
              ? <Loader2 size={15} className="animate-spin" />
              : <RefreshCw size={15} />}
            Sync GS
          </button>
          <Link to="/admin/produits/nouveau"
            className="btn-primary px-4 py-2.5 rounded-[4px] text-sm font-semibold flex items-center gap-2">
            <Plus size={16} />
            {t.admin.products.add}
          </Link>
        </div>
      </div>

      {syncResult && (
        <div
          className="flex items-center gap-2 mb-4 px-4 py-3 rounded-[4px] text-sm"
          style={{
            background: syncResult.ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${syncResult.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: syncResult.ok ? '#16a34a' : '#dc2626',
          }}
        >
          {syncResult.ok
            ? <CheckCircle2 size={15} />
            : <AlertCircle size={15} />}
          {syncResult.msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--ink-faint)" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.admin.products.search}
              className="w-full pl-9 pr-4 py-2.5 rounded-[4px] text-sm outline-none"
              style={{background:'var(--surface)', color:'var(--ink)', border:'1px solid var(--line)'}}
            />
          </div>
          <div className="flex rounded-[4px] overflow-hidden" style={{border:'1px solid var(--line)'}}>
            {(['all', 'published', 'unpublished'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2.5 text-xs font-medium transition-colors"
                style={{
                  background: filter === f ? 'var(--bks-brun)' : 'transparent',
                  color: filter === f ? 'var(--bks-creme)' : 'var(--ink-soft)',
                }}>
                {f === 'all' ? t.admin.products.all
                  : f === 'published' ? t.admin.products.published
                  : t.admin.products.unpublished}
              </button>
            ))}
          </div>
        </div>
        {brands.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {brands.map(b => (
              <button key={b} onClick={() => setBrandFilter(b)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: brandFilter === b ? 'var(--bks-brun)' : 'var(--surface-2)',
                  color: brandFilter === b ? 'var(--bks-creme)' : 'var(--ink-soft)',
                  letterSpacing: '0.05em',
                }}>
                {b === 'all' ? 'Toutes les marques' : b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" color="var(--bks-brun)" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto mb-3" color="var(--ink-faint)" />
          <p className="text-sm" style={{color:'var(--ink)', opacity:0.4}}>Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="rounded-[6px] overflow-hidden"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <div className="divide-y" style={{borderColor:'var(--line)'}}>
            {filtered.map(product => (
              <div key={product.id} className="flex items-center gap-4 px-4 py-4">

                {/* Image placeholder */}
                <div className="media w-14 shrink-0 rounded-[4px]" style={{aspectRatio:'4 / 5'}}>
                  <SmartImage src={product.images[0] ?? IMAGES.products[product.id]} alt={product.name} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-medium truncate" style={{color:'var(--ink)'}}>
                      {product.name}
                    </p>
                    {product.is_new && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{background:'var(--line-strong)', color:'#8A5A30'}}>
                        {t.admin.products.new}
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{background:'rgba(74,106,134,0.14)', color:'#4A6A86'}}>
                        {t.sections.featured}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{color:'var(--ink)', opacity:0.45}}>
                    {product.brand} · {product.price_sale.toFixed(2)} €
                    {product.price_buy
                      ? <span style={{opacity:0.6}}> (achat: {product.price_buy.toFixed(2)} €)</span>
                      : null}
                  </p>
                </div>

                {/* Stock type */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    product.stock_type === 'boutique' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-xs" style={{color:'var(--ink)', opacity:0.4}}>
                    {product.stock_type}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublish(product)}
                    disabled={toggling === product.id}
                    className="w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
                    title={product.is_published ? 'Masquer' : 'Publier'}
                  >
                    {toggling === product.id
                      ? <Loader2 size={16} className="animate-spin" color="#8A5A30" />
                      : product.is_published
                        ? <Eye size={16} color="#4E7A43" />
                        : <EyeOff size={16} color="var(--ink-faint)" />
                    }
                  </button>
                  <Link
                    to={`/admin/produits/${product.id}`}
                    className="w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <Edit2 size={16} color="#8A5A30" />
                  </Link>
                  <button
                    onClick={() => deleteProduct(product)}
                    disabled={deleting === product.id}
                    className="w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors hover:bg-red-50"
                    title="Supprimer"
                  >
                    {deleting === product.id
                      ? <Loader2 size={16} className="animate-spin" color="#A6412C" />
                      : <Trash2 size={16} color="#A6412C" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
