import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { productImage } from '../config/images'
import { useTranslation } from '../i18n/useTranslation'
import SmartImage from './SmartImage'
import { useCurrency } from '../context/CurrencyContext'

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { t } = useTranslation()
  const { formatPrice, formatEur, isEuro } = useCurrency()
  const img1 = productImage(product)
  const img2 = product.images[1] ?? null

  return (
    <Link to={`/produit/${product.slug ?? product.id}`} className="pcard">
      <div className="media media--zoom pcard__media">
        <SmartImage
          src={img1}
          alt={`${product.brand} ${product.name}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
        />
        {img2 && (
          <SmartImage
            src={img2}
            alt=""
            aria-hidden="true"
            className="pcard__media-alt"
          />
        )}
      </div>
      <div className="pcard__info">
        <div className="pcard__top">
          <span className="pcard__brand">{product.brand}</span>
          {product.isNew && <span className="pcard__flag">{t.product.new}</span>}
        </div>
        <h3 className="pcard__name">{product.name}</h3>
        <p className="pcard__price">
          {formatPrice(product.price)}
          {!isEuro && <span style={{ fontSize: '0.75em', opacity: 0.5, marginLeft: '0.35em' }}>≈ {formatEur(product.price)}</span>}
          {product.originalPrice && <s>{formatPrice(product.originalPrice)}</s>}
        </p>
      </div>
    </Link>
  )
}
