import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import { useProducts } from '../context/ProductsContext'

const BRAND_ORDER = ['Nike', 'Jordan', 'New Balance', 'Adidas', 'Asics', 'Ugg', 'Timberland', 'Autry', 'On', 'Salomon', 'Saucony', 'Yeezy']

const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@14/icons'
const svg = (content: string, vb = '0 0 200 80') =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${content}</svg>`)}`

const BRAND_LOGOS: Record<string, string> = {
  'Nike': `${SI}/nike.svg`,
  'Jordan': `${SI}/jordan.svg`,
  'New Balance': `${SI}/newbalance.svg`,
  'Adidas': `${SI}/adidas.svg`,
  // ASICS — 3 speed stripes (chevrons diagonaux, logo historique)
  'Asics': svg('<path d="M4,72 L32,8 L46,8 L18,72Z M48,72 L76,8 L90,8 L62,72Z M92,72 L120,8 L134,8 L106,72Z" fill="black"/>', '0 0 140 80'),
  // UGG — wordmark bold compact
  'Ugg': svg('<text x="4" y="72" font-family="Arial Black,sans-serif" font-size="76" font-weight="900" fill="black">UGG</text>', '0 0 180 80'),
  // Timberland — arbre iconique (tronc + couronne triangulaire)
  'Timberland': svg('<rect x="44" y="62" width="12" height="18" fill="black"/><polygon points="50,2 10,42 26,42 8,62 46,62 46,62 54,62 54,62 92,62 74,42 90,42" fill="black"/>', '0 0 100 82'),
  // Autry — wordmark
  'Autry': svg('<text x="2" y="68" font-family="Arial Black,sans-serif" font-size="62" font-weight="900" fill="black">AUTRY</text>', '0 0 240 76'),
  // On Running — wordmark minimaliste
  'On': svg('<text x="4" y="72" font-family="Helvetica Neue,Arial,sans-serif" font-size="80" font-weight="800" fill="black">On</text>', '0 0 140 82'),
  // Salomon — wordmark
  'Salomon': svg('<text x="1" y="62" font-family="Arial Black,sans-serif" font-size="52" font-weight="900" fill="black" letter-spacing="-1">SALOMON</text>', '0 0 290 68'),
  // Saucony — wordmark
  'Saucony': svg('<text x="1" y="62" font-family="Arial Black,sans-serif" font-size="52" font-weight="900" fill="black" letter-spacing="-1">SAUCONY</text>', '0 0 285 68'),
  // Yeezy — wordmark
  'Yeezy': svg('<text x="2" y="68" font-family="Arial Black,sans-serif" font-size="62" font-weight="900" fill="black">YEEZY</text>', '0 0 240 76'),
}

export default function BrandsPage() {
  const { products } = useProducts()

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
            <span className="brand-card__name">Tout</span>
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
