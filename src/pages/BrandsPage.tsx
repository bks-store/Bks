import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import { useProducts } from '../context/ProductsContext'
import { useTranslation } from '../i18n/useTranslation'

// Logos marques (fichiers dans public/images/brands/ si dispo, sinon initiales)
const BRAND_ORDER = ['Nike', 'Jordan', 'New Balance', 'Adidas', 'Asics', 'Ugg', 'Timberland', 'Autry', 'On', 'Salomon', 'Saucony', 'Yeezy']

export default function BrandsPage() {
  const { products } = useProducts()
  const { t } = useTranslation()

  // Comptage par marque
  const brandCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] ?? 0) + 1
    return acc
  }, {})

  // Toutes les marques présentes, triées par ordre défini puis alphabétique
  const allBrands = [...new Set(products.map(p => p.brand))]
  const sorted = [
    ...BRAND_ORDER.filter(b => allBrands.includes(b)),
    ...allBrands.filter(b => !BRAND_ORDER.includes(b)).sort(),
  ]

  return (
    <div className="container">
      <SEOHead
        path="/marques"
        titleFr="Marques — Nike, Jordan, New Balance, Adidas"
        titleEn="Brands — Nike, Jordan, New Balance, Adidas"
        descFr="Toutes les marques disponibles chez BKS Dinan : Nike, Jordan, New Balance, Adidas, Asics, UGG, Timberland et plus."
        descEn="All brands available at BKS Dinan: Nike, Jordan, New Balance, Adidas, Asics, UGG, Timberland and more."
      />

      <header className="page-head">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link><span>/</span><span aria-current="page">Marques</span>
        </nav>
        <h1 className="display h-lg">Marques</h1>
        <p className="lead" style={{ color: 'var(--ink-soft)', marginTop: '0.5rem' }}>
          {sorted.length} marques disponibles
        </p>
      </header>

      <div className="brands-grid">
        {sorted.map(brand => {
          const count = brandCounts[brand] ?? 0
          return (
            <Link
              key={brand}
              to={`/catalogue?brand=${encodeURIComponent(brand)}`}
              className="brand-card"
            >
              <div className="brand-card__inner">
                <span className="brand-card__name">{brand}</span>
                <span className="brand-card__count">{count} modèle{count !== 1 ? 's' : ''}</span>
                <ArrowRight size={14} strokeWidth={1.5} className="brand-card__arrow" />
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--line)' }}>
        <Link to="/catalogue" className="link-arrow">
          {t.sections.seeAllCatalogue} <ArrowRight size={14} strokeWidth={1.6} />
        </Link>
      </div>
    </div>
  )
}
