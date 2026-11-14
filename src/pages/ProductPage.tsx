import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { useProducts } from '../context/ProductsContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import ProductCard from '../components/ProductCard'
import SmartImage from '../components/SmartImage'
import { productImage } from '../config/images'
import { useCurrency } from '../context/CurrencyContext'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead, { buildProductSchema, SITE_URL } from '../components/SEOHead'

export default function ProductPage() {
  const { id: slugOrId } = useParams()
  const navigate = useNavigate()
  const { addItem, openCart } = useCart()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { products, loading } = useProducts()
  const product = products.find(p => (p.slug && p.slug === slugOrId) || p.id === slugOrId)

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const { formatPrice: fmtPrice, formatEur, isEuro } = useCurrency()

  if (loading) {
    return <div className="container" style={{minHeight:'60vh'}} />
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty" style={{paddingBlock:'8rem'}}>
          <p className="eyebrow" style={{marginBottom:'1rem'}}>404</p>
          <h1 className="display h-lg" style={{marginBottom:'2rem'}}>Produit introuvable</h1>
          <Link to="/catalogue" className="btn btn--solid">Retour au catalogue <ArrowRight size={16} strokeWidth={1.5} /></Link>
        </div>
      </div>
    )
  }

  const productTitle = product.name.toLowerCase().startsWith(product.brand.toLowerCase())
    ? product.name
    : `${product.brand} ${product.name}`

  const handleAdd = () => {
    if (!selectedSize) { setSizeError(true); return }
    addItem({ productId: product.id, name: product.name, brand: product.brand, price: product.price, size: selectedSize, quantity: 1, imageUrl: productImage(product, 400) ?? undefined })
    setAdded(true)
    addToast(`${productTitle} ajouté au panier`)
    openCart()
    setTimeout(() => setAdded(false), 2500)
  }

  const similar = products.filter(p => p.id !== product.id && (p.brand === product.brand || p.category === product.category)).slice(0, 4)
  const availableSizes = product.sizes.filter(s => s.available)
  const isLowStock = availableSizes.length > 0 && availableSizes.length <= 2

  const ogImage = productImage(product, 1200)
  const descFr = `${productTitle} — ${product.description || 'Sneakers disponibles chez BKS Dinan. Livraison France et international.'}`
  const descEn = `${productTitle} — ${product.description || 'Sneakers available at BKS Dinan. Shipping France and worldwide.'}`

  return (
    <>
      <SEOHead
        path={`/produit/${product.slug ?? product.id}`}
        titleFr={productTitle}
        titleEn={productTitle}
        descFr={descFr}
        descEn={descEn}
        image={ogImage?.startsWith('http') ? ogImage : ogImage ? `${SITE_URL}${ogImage}` : undefined}
        type="product"
        schema={buildProductSchema({ ...product, images: product.images.length ? product.images : ogImage ? [ogImage] : [] })}
      />
      <div className="container">
        <div style={{ paddingTop: '2rem' }}>
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft size={12} strokeWidth={2} />
            Retour
          </button>
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link><span>/</span>
            <Link to="/catalogue">Catalogue</Link><span>/</span>
            <span aria-current="page">{product.name}</span>
          </nav>
        </div>

        <div className="product">
          {/* Galerie photos */}
          <div className="product__gallery" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <div className="product__media media">
                <SmartImage
                  src={product.images[activeImg] ?? productImage(product, 1200) ?? undefined}
                  alt={`${product.brand} ${product.name}`}
                  loading="eager"
                  imgWidth={1000}
                />
              </div>
              {product.isNew && (
                <span style={{
                  position: 'absolute', top: '1rem', left: '1rem',
                  background: 'var(--bks-brun-profond)', color: 'var(--bks-creme)',
                  fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '2px',
                  pointerEvents: 'none',
                }}>
                  {t.product.new}
                </span>
              )}
              {product.originalPrice && (
                <span style={{
                  position: 'absolute', top: product.isNew ? '2.75rem' : '1rem', left: '1rem',
                  background: 'var(--accent)', color: 'var(--bks-brun-profond)',
                  fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '2px',
                  pointerEvents: 'none',
                }}>
                  Promo
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 72, height: 90, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4,
                      outline: activeImg === i ? '2px solid var(--ink)' : '1px solid var(--line)',
                      outlineOffset: 2, overflow: 'hidden', background: '#E9E0D2', flexShrink: 0,
                      transition: 'outline-color 0.15s',
                    }}
                    aria-label={`Vue ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', mixBlendMode: 'multiply' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panneau infos */}
          <div className="product__panel">
            {/* Marque + badge nouveau */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="eyebrow" style={{ margin: 0 }}>{product.brand}</span>
            </div>

            <h1 className="display h-md" style={{ marginBottom: '0.25rem' }}>{product.name}</h1>

            {/* Prix */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '2rem', marginTop: '1rem' }}>
              <span style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {fmtPrice(product.price)}
              </span>
              {!isEuro && (
                <span style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', fontWeight: 400 }}>
                  ≈ {formatEur(product.price)}
                </span>
              )}
              {product.originalPrice && (
                <s style={{ fontSize: '1rem', color: 'var(--ink-soft)', fontWeight: 400 }}>
                  {fmtPrice(product.originalPrice)}
                </s>
              )}
            </div>

            {/* Sélection taille */}
            <div style={{
              background: sizeError ? 'rgba(var(--accent-hover-rgb, 220,80,60), 0.04)' : 'var(--surface-2)',
              border: sizeError ? '1px solid var(--accent-hover)' : '1px solid var(--line)',
              borderRadius: '6px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                  {t.product.size}
                  {selectedSize && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>
                      — EU {selectedSize}
                    </span>
                  )}
                </span>
                {availableSizes.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    {availableSizes.length} taille{availableSizes.length > 1 ? 's' : ''} dispo
                  </span>
                )}
              </div>

              {availableSizes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
                  {product.sizes.map(s => (
                    <button
                      key={s.size}
                      disabled={!s.available}
                      aria-pressed={selectedSize === s.size}
                      onClick={() => { setSelectedSize(s.size); setSizeError(false) }}
                      style={{
                        height: '48px',
                        fontSize: '0.875rem',
                        fontWeight: selectedSize === s.size ? 700 : 500,
                        border: selectedSize === s.size
                          ? '2px solid var(--ink)'
                          : s.available ? '1px solid var(--line)' : '1px solid var(--line)',
                        borderRadius: '4px',
                        background: selectedSize === s.size ? 'var(--btn-bg)' : 'transparent',
                        color: selectedSize === s.size
                          ? 'var(--btn-ink)'
                          : s.available ? 'var(--ink)' : 'var(--ink-soft)',
                        cursor: s.available ? 'pointer' : 'not-allowed',
                        textDecoration: !s.available ? 'line-through' : 'none',
                        opacity: !s.available ? 0.35 : 1,
                        transition: 'all 0.12s',
                        position: 'relative',
                      }}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', margin: 0 }}>
                  Aucune taille disponible pour le moment.
                </p>
              )}

              {sizeError && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--accent-hover)', marginTop: '0.75rem', marginBottom: 0 }} role="alert">
                  {t.product.sizeError}
                </p>
              )}
            </div>

            {/* Urgence stock */}
            {isLowStock && (
              <p style={{
                fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)',
                marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                🔥 Plus que {availableSizes.length} taille{availableSizes.length > 1 ? 's' : ''} disponible{availableSizes.length > 1 ? 's' : ''}
              </p>
            )}

            {/* Bouton ajouter */}
            <button
              className="btn btn--solid btn--block"
              onClick={handleAdd}
              disabled={availableSizes.length === 0}
              style={{
                minHeight: '58px',
                fontSize: '0.9375rem',
                letterSpacing: '0.04em',
                marginBottom: '1rem',
              }}
            >
              {added
                ? <><Check size={16} strokeWidth={2} /> {t.product.added}</>
                : selectedSize
                  ? <>{t.product.addToCart} — EU {selectedSize}</>
                  : t.product.addToCart}
            </button>

            {/* Trust badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              {[
                { icon: <Truck size={15} strokeWidth={1.5} />, label: 'Livraison DHL' },
                { icon: <ShieldCheck size={15} strokeWidth={1.5} />, label: '100% Authentique' },
                { icon: <RotateCcw size={15} strokeWidth={1.5} />, label: 'Retours 14j' },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                  padding: '0.75rem 0.5rem',
                  background: 'var(--surface-2)',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}>
                  <span style={{ color: 'var(--accent)' }}>{b.icon}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', lineHeight: 1.3 }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="product__stock">
              {product.stockType === 'boutique' ? t.product.stockBoutique : t.product.stockDropship}
            </p>

            <div className="product__details">
              <details>
                <summary>{t.product.delivery} &amp; {t.product.returns.toLowerCase()}</summary>
                <p>{t.product.delivery} {t.product.deliverySub} · {t.product.returns} {t.product.returnsSub}.</p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section bg-surface-2">
          <div className="container">
            <div className="section-head">
              <h2 className="display h-md">{t.product.youMayLike}</h2>
              <Link to="/catalogue" className="link-arrow">{t.sections.seeAllCatalogue} <ArrowRight size={14} strokeWidth={1.6} /></Link>
            </div>
            <div className="pgrid pgrid--4 pgrid--rail">
              {similar.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
