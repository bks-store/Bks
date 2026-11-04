import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { productImage } from '../config/images'
import { useTranslation } from '../i18n/useTranslation'
import SmartImage from './SmartImage'
import { formatPrice } from '../lib/format'

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const img1 = productImage(product)
  const img2 = product.images[1] ?? null

  return (
    <Link to={`/produit/${product.id}`} className="pcard">
      <div className="media media--zoom pcard__media">
        <SmartImage src={img1} alt={`${product.brand} ${product.name}`} />
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
          {product.originalPrice && <s>{formatPrice(product.originalPrice)}</s>}
        </p>
      </div>
    </Link>
  )
}
