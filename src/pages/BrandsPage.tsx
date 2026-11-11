import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import { useProducts } from '../context/ProductsContext'
import { useTranslation } from '../i18n/useTranslation'

const BRAND_ORDER = ['Nike', 'Jordan', 'New Balance', 'Adidas', 'Asics', 'Ugg', 'Timberland', 'Autry', 'On', 'Salomon', 'Saucony', 'Yeezy']

const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@14/icons'
const svgWordmark = (text: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><text x="0" y="50" font-family="Arial Black,sans-serif" font-size="52" font-weight="900" fill="black">${text}</text></svg>`)}`

const BRAND_LOGOS: Record<string, string> = {
  'Nike': `${SI}/nike.svg`,
  'Jordan': `${SI}/jordan.svg`,
  'New Balance': `${SI}/newbalance.svg`,
  'Adidas': `${SI}/adidas.svg`,
  'Asics': svgWordmark('ASICS'),
  'Ugg': svgWordmark('UGG'),
  'Timberland': svgWordmark('TIMBERLAND'),
  'Autry': svgWordmark('AUTRY'),
  'On': svgWordmark('On'),
  'Salomon': svgWordmark('SALOMON'),
  'Saucony': svgWordmark('SAUCONY'),
  'Yeezy': svgWordmark('YEEZY'),
}

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
        {/* Carte "Tout" */}
        <Link to="/catalogue" className="brand-card brand-card--all" data-brand="Tout">
          <div className="brand-card__inner">
            <span className="brand-card__name">{t.nav?.allProducts ?? 'Tout'}</span>
            <span className="brand-card__count">{products.length} modèle{products.length !== 1 ? 's' : ''}</span>
            <ArrowRight size={14} strokeWidth={1.5} className="brand-card__arrow" />
          </div>
        </Link>

        {sorted.map(brand => {
          const count = brandCounts[brand] ?? 0
          const logo = BRAND_LOGOS[brand]
          return (
            <Link
              key={brand}
              to={`/catalogue?brand=${encodeURIComponent(brand)}`}
              className={`brand-card${logo ? ' brand-card--has-logo' : ''}`}
              data-brand={brand}
            >
              {logo && (
                <img
                  src={logo}
                  alt=""
                  className="brand-card__logo"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="brand-card__inner">
                <span className="brand-card__name">{brand}</span>
                <span className="brand-card__count">{count} modèle{count !== 1 ? 's' : ''}</span>
                <ArrowRight size={14} strokeWidth={1.5} className="brand-card__arrow" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
