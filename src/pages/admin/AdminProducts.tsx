import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Eye, EyeOff, Package, Loader2, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbProduct } from '../../types/database'
import { PRODUCTS } from '../../data/products'

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
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 35
  const listRef = useRef<HTMLDivElement>(null)
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

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

  const thumb = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('supabase.co/storage')) {
      return `/api/img?url=${encodeURIComponent(url)}&w=120`
    }
    return url
  }

  const brands = [...new Set(products.map(p => p.brand))].sort()

  // Auto-sélectionner la première marque après chargement
  useEffect(() => {
    if (brands.length && !brandFilter) setBrandFilter(brands[0])
  }, [brands.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page quand filtre/marque/recherche change
  useEffect(() => { setPage(1) }, [brandFilter, filter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filtered = products.filter(p => {
    if (!brandFilter || p.brand !== brandFilter) return false
    const matchSearch = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true :
      filter === 'published' ? p.is_published : !p.is_published
    return matchSearch && matchFilter
  }).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      {/* Page header */}
      <div className="admin-head">
        <div>
          <p className="eyebrow" style={{textTransform:'uppercase', fontSize:'0.6875rem', letterSpacing:'0.14em', color:'var(--ink-soft)', marginBottom:'0.4rem'}}>Catalogue</p>
          <h1 className="admin-title">{t.admin.products.title}</h1>
          <p style={{fontSize:'0.75rem', color:'var(--ink-faint)', marginTop:'0.3rem'}}>
            {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
            {brandFilter && <span style={{marginLeft:'0.4rem', opacity:0.6}}>— {brandFilter}</span>}
            {Math.ceil(filtered.length / PAGE_SIZE) > 1 && <span style={{marginLeft:'0.4rem', opacity:0.5}}>· p.{page}/{Math.ceil(filtered.length / PAGE_SIZE)}</span>}
          </p>
        </div>
        <Link to="/admin/produits/nouveau" className="btn-primary" style={{gap:'0.5rem', display:'inline-flex', alignItems:'center'}}>
          <Plus size={16} strokeWidth={2} />
          {t.admin.products.add}
        </Link>
      </div>

      {/* Sync GS banner */}
      <div className="admin-card" style={{marginBottom:'1.5rem', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', flexWrap:'wrap', gap:'1rem', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:'1rem', minWidth:0}}>
          <div style={{
            width:40, height:40, borderRadius:8, flexShrink:0,
            background:'rgba(200,149,90,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--accent)',
          }}>
            <RefreshCw size={18} strokeWidth={1.8} />
          </div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'0.875rem', fontWeight:600, color:'var(--ink)'}}>Synchronisation Golden Sneakers</p>
            <p style={{fontSize:'0.75rem', color:'var(--ink-faint)', marginTop:'0.15rem'}}>
              Importe les photos et les tailles depuis votre fournisseur
            </p>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0}}>
          {syncResult && (
            <div style={{
              display:'flex', alignItems:'center', gap:'0.4rem',
              fontSize:'0.8125rem', fontWeight:500,
              color: syncResult.ok ? '#3D7A43' : '#A6412C',
            }}>
              {syncResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {syncResult.msg}
            </div>
          )}
          <button
            onClick={syncCatalog}
            disabled={syncing}
            className="btn-primary"
            style={{gap:'0.5rem', display:'inline-flex', alignItems:'center', opacity: syncing ? 0.7 : 1}}
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
            {syncing ? 'Sync en cours…' : 'Sync GS'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.25rem'}}>
        <div style={{display:'flex', flexWrap:'wrap', gap:'0.75rem'}}>
          <div style={{position:'relative', flex:'1 1 220px', minWidth:0}}>
            <Search size={15} style={{position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)', pointerEvents:'none'}} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.admin.products.search}
              style={{
                width:'100%', paddingLeft:'2.5rem', paddingRight:'1rem', paddingBlock:'0.625rem',
                borderRadius:6, fontSize:'0.875rem', background:'var(--card)',
                color:'var(--ink)', border:'1px solid var(--line)', outline:'none',
              }}
            />
          </div>
          <div style={{display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--line)', flexShrink:0}}>
            {(['all', 'published', 'unpublished'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding:'0.5rem 1rem', fontSize:'0.75rem', fontWeight:600,
                  background: filter === f ? 'var(--a-sidebar)' : 'var(--card)',
                  color: filter === f ? '#F4EEE5' : 'var(--ink-soft)',
                  border:'none', cursor:'pointer', transition:'background 0.15s',
                }}>
                {f === 'all' ? t.admin.products.all
                  : f === 'published' ? t.admin.products.published
                  : t.admin.products.unpublished}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:'flex', flexWrap:'wrap', gap:'0.4rem'}}>
          {brands.map(b => (
            <button key={b} onClick={() => setBrandFilter(b)}
              style={{
                padding:'0.3rem 0.75rem', borderRadius:999, fontSize:'0.6875rem', fontWeight:600,
                background: brandFilter === b ? 'var(--a-sidebar)' : 'var(--surface-2)',
                color: brandFilter === b ? '#F4EEE5' : 'var(--ink-soft)',
                border:'none', cursor:'pointer', letterSpacing:'0.06em',
                transition:'background 0.15s',
              }}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Products list */}
      <div ref={listRef} />
      {loading ? (
        <div style={{display:'flex', justifyContent:'center', padding:'5rem 0'}}>
          <Loader2 size={28} className="animate-spin" color="var(--accent)" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center', padding:'5rem 0', color:'var(--ink-faint)'}}>
          <Package size={40} style={{margin:'0 auto 1rem', opacity:0.3}} />
          <p style={{fontSize:'0.875rem'}}>Aucun produit trouvé</p>
        </div>
      ) : (
        <>
          <div className="admin-card" style={{overflow:'hidden'}}>
            {paginated.map((product, idx) => {
              const imgSrc = product.images?.[0]
              return (
                <div key={product.id} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  padding:'0.875rem 1.25rem',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--line)',
                  transition:'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,90,48,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Product image */}
                  <div style={{
                    width:68, height:68, flexShrink:0, borderRadius:8,
                    overflow:'hidden', background:'var(--surface)',
                    border:'1px solid var(--line)',
                  }}>
                    {imgSrc ? (
                      <img
                        src={thumb(imgSrc)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        style={{width:'100%', height:'100%', objectFit:'cover'}}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <Package size={22} color="var(--ink-faint)" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.25rem'}}>
                      <p style={{fontSize:'0.9375rem', fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {product.name}
                      </p>
                      {product.is_new && (
                        <span style={{fontSize:'0.5625rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:999, background:'rgba(200,149,90,0.14)', color:'var(--accent)', letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0}}>
                          New
                        </span>
                      )}
                      {product.is_featured && (
                        <span style={{fontSize:'0.5625rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:999, background:'rgba(74,106,134,0.1)', color:'#4A6A86', letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0}}>
                          Vedette
                        </span>
                      )}
                    </div>
                    <p style={{fontSize:'0.75rem', color:'var(--ink-faint)'}}>
                      {product.brand}
                      <span style={{margin:'0 0.35rem', opacity:0.4}}>·</span>
                      <span style={{fontWeight:600, color:'var(--ink)'}}>
                        {product.price_sale.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}
                      </span>
                      {product.price_buy ? (
                        <span style={{marginLeft:'0.4rem', opacity:0.55}}>
                          achat {product.price_buy.toFixed(0)} €
                        </span>
                      ) : null}
                    </p>
                  </div>

                  {/* Stock type badge */}
                  <div style={{display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0}}>
                    <div style={{
                      width:6, height:6, borderRadius:'50%',
                      background: product.stock_type === 'boutique' ? '#4E7A43' : '#C8955A',
                    }} />
                  </div>

                  {/* Actions */}
                  <div style={{display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
                    <button
                      onClick={() => togglePublish(product)}
                      disabled={toggling === product.id}
                      style={{width:36, height:36, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', outline:'none', transition:'background 0.15s'}}
                      title={product.is_published ? 'Masquer' : 'Publier'}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {toggling === product.id
                        ? <Loader2 size={16} className="animate-spin" color="var(--accent)" />
                        : product.is_published
                          ? <Eye size={16} color="#4E7A43" />
                          : <EyeOff size={16} color="var(--ink-faint)" />
                      }
                    </button>
                    <Link
                      to={`/admin/produits/${product.id}`}
                      style={{width:36, height:36, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', transition:'background 0.15s', color:'var(--accent)'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Edit2 size={16} strokeWidth={1.8} />
                    </Link>
                    <button
                      onClick={() => deleteProduct(product)}
                      disabled={deleting === product.id}
                      style={{width:36, height:36, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', outline:'none', transition:'background 0.15s'}}
                      title="Supprimer"
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(166,65,44,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {deleting === product.id
                        ? <Loader2 size={16} className="animate-spin" color="#A6412C" />
                        : <Trash2 size={16} color="#A6412C" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem', padding:'1.5rem 0'}}>
              <button
                onClick={() => { setPage(p => p - 1); scrollToList() }}
                disabled={page === 1}
                style={{minWidth:'2rem', height:'2rem', borderRadius:4, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-soft)', fontSize:'0.8125rem', cursor:'pointer', outline:'none', opacity: page === 1 ? 0.3 : 1}}
              >←</button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => { setPage(n); scrollToList() }}
                  style={{minWidth:'2rem', height:'2rem', borderRadius:4, border:'1px solid var(--line)', background: n === page ? 'var(--a-sidebar)' : 'transparent', color: n === page ? '#F4EEE5' : 'var(--ink-soft)', fontSize:'0.8125rem', fontWeight: n === page ? 600 : 400, cursor:'pointer', outline:'none'}}
                >{n}</button>
              ))}
              <button
                onClick={() => { setPage(p => p + 1); scrollToList() }}
                disabled={page === totalPages}
                style={{minWidth:'2rem', height:'2rem', borderRadius:4, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-soft)', fontSize:'0.8125rem', cursor:'pointer', outline:'none', opacity: page === totalPages ? 0.3 : 1}}
              >→</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
