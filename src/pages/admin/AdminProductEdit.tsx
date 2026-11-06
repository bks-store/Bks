import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, Loader2, Check, Upload, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, isConfigured } from '../../lib/supabase'
import { useTranslation } from '../../i18n/useTranslation'
import type { DbProduct, DbProductSize, StockType, ProductCategory } from '../../types/database'
import { PRODUCTS } from '../../data/products'

const COMMON_SIZES = ['35','36','37','38','39','40','41','42','43','44','45','46','47']
const CATEGORIES: ProductCategory[] = ['sneakers', 'streetwear', 'accessoires']

type SizeEntry = { size: string; stock_qty: number }

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{background: checked ? 'var(--bks-brun)' : 'var(--line-strong)'}}>
        <div className="absolute top-1 w-4 h-4 rounded-full transition-transform"
          style={{background:'var(--bks-creme)', transform: checked ? 'translateX(22px)' : 'translateX(4px)'}} />
      </div>
      <span className="text-sm" style={{color:'var(--ink)', opacity:0.8}}>{label}</span>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wider uppercase mb-2"
        style={{color:'#8A5A30'}}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  background:'var(--surface)',
  color:'var(--ink)',
  border:'1px solid var(--line-strong)',
}

export default function AdminProductEdit() {
  const { id } = useParams()
  const isNew = id === 'nouveau'
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<ProductCategory>('sneakers')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceSale, setPriceSale] = useState('')
  const [priceBuy, setPriceBuy] = useState('')
  const [priceOriginal, setPriceOriginal] = useState('')
  const [stockType, setStockType] = useState<StockType>('boutique')
  const [isPublished, setIsPublished] = useState(false)
  const [isNew2, setIsNew2] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [sizes, setSizes] = useState<SizeEntry[]>([])
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      if (!isConfigured) {
        const p = PRODUCTS.find(x => x.id === id)
        if (p) {
          setName(p.name); setBrand(p.brand); setCategory(p.category)
          setSubcategory(p.subcategory); setDescription(p.description)
          setPriceSale(p.price.toString()); setPriceBuy((p.price * 0.65).toFixed(2))
          if (p.originalPrice) setPriceOriginal(p.originalPrice.toString())
          setStockType(p.stockType); setIsPublished(true)
          setIsNew2(p.isNew); setIsFeatured(p.isFeatured)
          setSizes(p.sizes.map(s => ({ size: s.size, stock_qty: s.available ? 1 : 0 })))
          setImages(p.images)
        }
        setLoading(false)
        return
      }
      const [productRes, sizesRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id as string).single(),
        supabase.from('product_sizes').select('*').eq('product_id', id as string),
      ])
      const p = productRes.data as unknown as DbProduct
      if (p) {
        setName(p.name); setBrand(p.brand); setCategory(p.category)
        setSubcategory(p.subcategory ?? ''); setDescription(p.description ?? '')
        setPriceSale(p.price_sale.toString())
        setPriceBuy(p.price_buy?.toString() ?? '')
        setPriceOriginal(p.price_original?.toString() ?? '')
        setStockType(p.stock_type); setIsPublished(p.is_published)
        setIsNew2(p.is_new); setIsFeatured(p.is_featured)
        setImages(p.images)
      }
      const s: DbProductSize[] = sizesRes.data ?? []
      setSizes(s.map(x => ({ size: x.size, stock_qty: x.stock_qty })))
      setLoading(false)
    }
    load()
  }, [id, isNew])

  const addSize = (size: string) => {
    if (!sizes.find(s => s.size === size)) {
      setSizes(prev => [...prev, { size, stock_qty: 1 }].sort((a, b) =>
        parseFloat(a.size) - parseFloat(b.size)
      ))
    }
  }

  const removeSize = (size: string) => setSizes(prev => prev.filter(s => s.size !== size))
  const updateSizeQty = (size: string, qty: number) =>
    setSizes(prev => prev.map(s => s.size === size ? { ...s, stock_qty: qty } : s))

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  const uploadImages = async (files: FileList) => {
    if (!isConfigured || files.length === 0) return
    setUploading(true)
    const productId = isNew ? `new-${Date.now()}` : id
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      form.append('productId', productId ?? 'unknown')
      const { data, error } = await supabase.functions.invoke('upload-image', { body: form })
      if (!error && data?.url) {
        newUrls.push(data.url)
      } else {
        console.error('[upload-image]', error ?? data)
      }
    }
    setImages(prev => [...prev, ...newUrls])
    setUploading(false)
  }

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    setImages(prev => {
      const a = [...prev]
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')

    const productData = {
      name, brand, category, subcategory: subcategory || null,
      description: description || null,
      price_sale: parseFloat(priceSale),
      price_buy: priceBuy ? parseFloat(priceBuy) : null,
      price_original: priceOriginal ? parseFloat(priceOriginal) : null,
      stock_type: stockType,
      is_published: isPublished,
      is_new: isNew2,
      is_featured: isFeatured,
      images,
    }

    if (!isConfigured) {
      // Démo: juste simuler
      await new Promise(r => setTimeout(r, 800))
      setSuccess(true)
      setTimeout(() => navigate('/admin/produits'), 1500)
      setSaving(false)
      return
    }

    let productId = id
    if (isNew) {
      const { data: newProd, error: e } = await supabase.from('products').insert(productData as any).select().single()
      if (e) { setError(t.admin.productEdit.error); setSaving(false); return }
      productId = (newProd as any).id
    } else {
      const { error: e } = await (supabase.from('products') as any).update(productData).eq('id', id)
      if (e) { setError(t.admin.productEdit.error); setSaving(false); return }
      // Supprimer anciennes tailles
      await (supabase.from('product_sizes') as any).delete().eq('product_id', id)
    }

    // Insérer les tailles
    if (sizes.length > 0) {
      await (supabase.from('product_sizes') as any).insert(
        sizes.map(s => ({ product_id: productId, size: s.size, stock_qty: s.stock_qty }))
      )
    }

    setSuccess(true)
    setTimeout(() => navigate('/admin/produits'), 1500)
    setSaving(false)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin" color="var(--bks-brun)" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/produits"
          className="w-9 h-9 rounded-[4px] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={18} color="var(--ink)" />
        </Link>
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="admin-title">
            {isNew ? t.admin.productEdit.addTitle : t.admin.productEdit.editTitle}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Toggles en haut (les plus importants sur mobile) */}
        <div className="rounded-[6px] p-5 space-y-4"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <Toggle checked={isPublished} onChange={setIsPublished} label={t.admin.productEdit.publish} />
          <Toggle checked={isNew2} onChange={setIsNew2} label={t.admin.productEdit.markNew} />
          <Toggle checked={isFeatured} onChange={setIsFeatured} label={t.admin.productEdit.markFeatured} />
        </div>

        {/* Identité */}
        <div className="rounded-[6px] p-5 space-y-4"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <Field label={t.admin.productEdit.name}>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.admin.productEdit.brand}>
              <input value={brand} onChange={e => setBrand(e.target.value)} required
                className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label={t.admin.productEdit.category}>
              <select value={category} onChange={e => setCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t.admin.productEdit.description}>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className="w-full px-4 py-3 rounded-[4px] text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>
        </div>

        {/* Prix */}
        <div className="rounded-[6px] p-5 space-y-4"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.admin.productEdit.priceSale}>
              <input type="number" step="0.01" min="0" value={priceSale}
                onChange={e => setPriceSale(e.target.value)} required
                className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label={t.admin.productEdit.priceBuy}>
              <input type="number" step="0.01" min="0" value={priceBuy}
                onChange={e => {
                  const buy = parseFloat(e.target.value)
                  setPriceBuy(e.target.value)
                  if (!isNaN(buy) && buy > 0) {
                    // Majoration 65% TVA incluse : PV TTC = PA * 1.65
                    const pvTTC = buy * 1.65
                    setPriceSale(Math.ceil(pvTTC * 100 - 1) / 100 + '')
                  }
                }}
                placeholder="Confidentiel"
                className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
            </Field>
          </div>
          <Field label={t.admin.productEdit.priceOriginal}>
            <input type="number" step="0.01" min="0" value={priceOriginal}
              onChange={e => setPriceOriginal(e.target.value)} placeholder="Laisser vide si aucune promo"
              className="w-full px-4 py-3 rounded-[4px] text-sm outline-none" style={inputStyle} />
          </Field>
          <Field label={t.admin.productEdit.stockType}>
            <div className="grid grid-cols-3 gap-2">
              {(['boutique', 'dropshipping', 'check'] as StockType[]).map(s => (
                <button key={s} type="button" onClick={() => setStockType(s)}
                  className="py-2 px-2 rounded-[4px] text-xs font-medium transition-all text-center"
                  style={{
                    background: stockType === s ? 'var(--bks-brun)' : 'var(--line)',
                    color: stockType === s ? 'var(--bks-creme)' : 'var(--ink-soft)',
                    border: `1px solid ${stockType === s ? 'var(--bks-brun)' : 'var(--line)'}`,
                  }}>
                  {s === 'boutique' ? 'Boutique' : s === 'dropshipping' ? 'Fournisseur' : 'À vérifier'}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Tailles */}
        <div className="rounded-[6px] p-5"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <h3 className="text-xs font-semibold tracking-wider uppercase mb-4" style={{color:'#8A5A30'}}>
            {t.admin.productEdit.sizes}
          </h3>

          {/* Sélecteur rapide */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {COMMON_SIZES.map(s => (
              <button key={s} type="button" onClick={() => addSize(s)}
                className="w-10 h-10 rounded-[4px] text-xs font-medium transition-all"
                style={{
                  background: sizes.find(x => x.size === s) ? 'var(--bks-brun)' : 'var(--line)',
                  color: sizes.find(x => x.size === s) ? 'var(--bks-creme)' : 'var(--ink-faint)',
                  border: `1px solid ${sizes.find(x => x.size === s) ? 'var(--bks-brun)' : 'var(--line)'}`,
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Tailles sélectionnées avec quantité */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              {sizes.map(s => (
                <div key={s.size} className="flex items-center gap-3">
                  <span className="w-10 text-center text-sm font-medium shrink-0"
                    style={{color:'var(--ink)'}}>{s.size}</span>
                  <input type="number" min="0" value={s.stock_qty}
                    onChange={e => updateSizeQty(s.size, parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 rounded-[4px] text-sm text-center outline-none" style={inputStyle} />
                  <span className="text-xs flex-1" style={{color:'var(--ink)', opacity:0.4}}>
                    {s.stock_qty === 0 ? 'Indisponible' : `${s.stock_qty} en stock`}
                  </span>
                  <button type="button" onClick={() => removeSize(s.size)}
                    className="w-7 h-7 rounded-[4px] flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
                    <X size={14} color="var(--ink-faint)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="rounded-[6px] p-5"
          style={{background:'var(--card)', border:'1px solid var(--line)'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold tracking-wider uppercase" style={{color:'#8A5A30'}}>
              Photos ({images.length})
            </h3>
            {images.length > 0 && (
              <span className="text-xs" style={{color:'var(--ink-faint)'}}>La première est la photo principale</span>
            )}
          </div>

          {/* Upload + URL */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files && uploadImages(e.target.files)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-primary px-4 py-2.5 rounded-[4px] text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading ? 'Upload…' : 'Ajouter des photos'}
            </button>
            <div className="flex gap-2 flex-1 min-w-[180px]">
              <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Ou coller une URL…"
                className="flex-1 px-3 py-2.5 rounded-[4px] text-sm outline-none" style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
              <button type="button" onClick={addImage}
                className="px-3 py-2.5 rounded-[4px] text-sm flex items-center"
                style={{background:'var(--line)', color:'var(--ink-soft)', border:'1px solid var(--line)'}}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Grille d'images */}
          {images.length > 0 ? (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'0.75rem'}}>
              {images.map((url, i) => (
                <div key={url + i} style={{position:'relative', aspectRatio:'4/5', borderRadius:6, overflow:'hidden', background:'var(--surface)', border:`2px solid ${i === 0 ? 'var(--accent)' : 'var(--line)'}`}}>
                  <img src={url} alt="" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}
                    loading="lazy" decoding="async"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }} />
                  {i === 0 && (
                    <span style={{position:'absolute', top:4, left:4, background:'var(--accent)', color:'#F4EFE6', fontSize:'9px', fontWeight:700, letterSpacing:'0.08em', padding:'2px 6px', borderRadius:3, textTransform:'uppercase'}}>
                      Principale
                    </span>
                  )}
                  <div style={{position:'absolute', bottom:4, right:4, display:'flex', gap:3}}>
                    {i > 0 && (
                      <button type="button" onClick={() => moveImage(i, -1)}
                        style={{width:22, height:22, borderRadius:4, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer'}}>
                        <ChevronLeft size={12} color="#fff" />
                      </button>
                    )}
                    {i < images.length - 1 && (
                      <button type="button" onClick={() => moveImage(i, 1)}
                        style={{width:22, height:22, borderRadius:4, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer'}}>
                        <ChevronRight size={12} color="#fff" />
                      </button>
                    )}
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      style={{width:22, height:22, borderRadius:4, background:'rgba(166,65,44,0.85)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer'}}>
                      <X size={11} color="#fff" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{border:'2px dashed var(--line)', borderRadius:8, padding:'2.5rem 1rem', textAlign:'center', cursor:'pointer'}}
              onClick={() => fileInputRef.current?.click()}>
              <Upload size={28} style={{margin:'0 auto 0.75rem', opacity:0.3, color:'var(--ink)'}} />
              <p style={{fontSize:'0.875rem', color:'var(--ink-faint)', margin:0}}>Cliquez ou déposez vos photos ici</p>
            </div>
          )}
        </div>

        {/* Error / Success */}
        {error && (
          <p className="text-sm py-3 px-4 rounded-[4px]" style={{background:'rgba(166,65,44,0.12)', color:'#A6412C'}}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm py-3 px-4 rounded-[4px] flex items-center gap-2"
            style={{background:'rgba(78,122,67,0.14)', color:'#4E7A43'}}>
            <Check size={16} /> {t.admin.productEdit.success}
          </p>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 btn-primary py-4 rounded-[6px] text-sm font-semibold tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" /> {t.admin.productEdit.saving}</>
              : t.admin.productEdit.save}
          </button>
          <Link to="/admin/produits"
            className="btn-outline px-6 py-4 rounded-[6px] text-sm font-medium">
            {t.admin.productEdit.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
