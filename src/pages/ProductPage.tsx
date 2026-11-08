import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useProducts } from '../context/ProductsContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import ProductCard from '../components/ProductCard'
import SmartImage from '../components/SmartImage'
import { productImage } from '../config/images'
import { formatPrice } from '../lib/format'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead, { buildProductSchema, SITE_URL } from '../components/SEOHead'

export default function ProductPage() {
  const { id } = useParams()
  const { addItem, openCart } = useCart()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { products, loading } = useProducts()
  const product = products.find(p => p.id === id)

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)

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

  const handleAdd = () => {
    if (!selectedSize) { setSizeError(true); return }
    addItem({ productId: product.id, name: product.name, brand: product.brand, price: product.price, size: selectedSize, quantity: 1 })
    setAdded(true)
    addToast(`${product.brand} ${product.name} ajouté au panier`)
    openCart()
    setTimeout(() => setAdded(false), 2500)
  }

  const similar = products.filter(p => p.id !== product.id && (p.brand === product.brand || p.category === product.category)).slice(0, 4)

  const ogImage = productImage(product, 1200)
  const productTitle = product.name.toLowerCase().startsWith(product.brand.toLowerCase())
    ? product.name
    : `${product.brand} ${product.name}`
  const descFr = `${productTitle} — ${product.description || 'Sneakers disponibles chez BKS Dinan. Livraison France et international.'}`
  const descEn = `${productTitle} — ${product.description || 'Sneakers available at BKS Dinan. Shipping France and worldwide.'}`

  return (
    <>
      <SEOHead
        path={`/produit/${product.id}`}
        titleFr={productTitle}
        titleEn={productTitle}
        descFr={descFr}
        descEn={descEn}
        image={ogImage?.startsWith('http') ? ogImage : ogImage ? `${SITE_URL}${ogImage}` : undefined}
        type="product"
        schema={buildProductSchema({ ...product, images: product.images.length ? product.images : ogImage ? [ogImage] : [] })}
      />
      <div className="container">
        <nav className="crumbs" aria-label="Fil d'Ariane" style={{paddingTop:'2rem'}}>
          <Link to="/">Accueil</Link><span>/</span>
          <Link to="/catalogue">Catalogue</Link><span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product">
          <div className="product__media media">
            <SmartImage src={productImage(product, 1200)} alt={`${product.brand} ${product.name}`} loading="eager" imgWidth={1000} />
          </div>

          <div className="product__panel">
            <p className="eyebrow">{product.brand}{product.isNew && ` — ${t.product.new}`}</p>
            <h1 className="display h-md">{product.name}</h1>
            <p className="product__price">
              {formatPrice(product.price)}
              {product.originalPrice && <s>{formatPrice(product.originalPrice)}</s>}
            </p>

            <div className="product__label">
              <span>{t.product.size}</span>
              {selectedSize && <span style={{color:'var(--ink)'}}>{t.product.sizeSelect} {selectedSize}</span>}
            </div>
            {sizeError && <p className="product__error" role="alert">{t.product.sizeError}</p>}
            <div className="product__sizes">
              {product.sizes.filter(s => s.available).map(s => (
                <button
                  key={s.size}
                  className={`chip ${selectedSize === s.size ? 'is-active' : ''}`}
                  aria-pressed={selectedSize === s.size}
                  onClick={() => { setSelectedSize(s.size); setSizeError(false) }}
                >
                  {s.size}
                </button>
              ))}
            </div>

            <button className="btn btn--solid btn--block" onClick={handleAdd} style={{minHeight:'58px'}}>
              {added ? <><Check size={16} strokeWidth={1.8} /> {t.product.added}</> : t.product.addToCart}
            </button>
            <p className="product__stock">
              {product.stockType === 'boutique' ? t.product.stockBoutique : t.product.stockDropship}
            </p>

            <div className="product__details">
              <details open>
                <summary>{t.product.description}</summary>
                <p>{product.description}</p>
              </details>
              <details>
                <summary>{t.product.delivery} &amp; {t.product.returns.toLowerCase()}</summary>
                <p>{t.product.delivery} {t.product.deliverySub} · {t.product.returns} {t.product.returnsSub} · {t.product.authentic} : {t.product.authenticSub.toLowerCase()}.</p>
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
