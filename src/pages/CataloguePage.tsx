import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductCardSkeleton'
import { useTranslation } from '../i18n/useTranslation'
import { useContent } from '../context/ContentContext'
import { useProducts } from '../context/ProductsContext'
import { productsForRubrique } from '../lib/content'
import SmartImage from '../components/SmartImage'
import SEOHead from '../components/SEOHead'

const SIZES_ALL = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
const PRICE_RANGE_MINS = [0, 100, 150, 200]
const PRICE_RANGE_MAXES = [100, 150, 200, 9999]

export default function CataloguePage() {
  const { category, slug } = useParams()
  const { rubriqueBySlug, loading: contentLoading } = useContent()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const rubrique = slug ? rubriqueBySlug(slug) : undefined
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get('nouveau') === 'true'
  const rawQuery = (searchParams.get('q') ?? '').trim()
  const query = rawQuery.toLowerCase()
  const { t } = useTranslation()

  const brandParam = searchParams.get('brand')
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandParam ? [brandParam] : [])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'nouveautes' | 'prix-asc' | 'prix-desc'>('nouveautes')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const gridRef = useRef<HTMLDivElement>(null)

  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  const toggle = <T,>(list: T[], setList: (v: T[]) => void, value: T) =>
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value])

  const clearAll = () => { setSelectedBrands([]); setSelectedSizes([]); setSelectedPrice(null); setPage(1) }

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1) }, [selectedBrands, selectedSizes, selectedPrice, sortBy, slug, category, query])

  const BRANDS = [...new Set(allProducts.map(p => p.brand))].sort()

  const filtered = useMemo(() => {
    let products = rubrique ? productsForRubrique(rubrique, allProducts) : [...allProducts]
    if (category) products = products.filter(p => p.category === category)
    if (isNew) products = products.filter(p => p.isNew)
    if (query) products = products.filter(p => `${p.brand} ${p.name}`.toLowerCase().includes(query))
    if (selectedBrands.length) products = products.filter(p => selectedBrands.includes(p.brand))
    if (selectedSizes.length) products = products.filter(p => p.sizes.some(s => selectedSizes.includes(s.size) && s.available))
    if (selectedPrice !== null) {
      products = products.filter(p => p.price >= PRICE_RANGE_MINS[selectedPrice] && p.price < PRICE_RANGE_MAXES[selectedPrice])
    }
    switch (sortBy) {
      case 'prix-asc': products.sort((a, b) => a.price - b.price); break
      case 'prix-desc': products.sort((a, b) => b.price - a.price); break
      default: if (rubrique?.ruleType !== 'manual') products.sort((a, b) => Number(b.isNew) - Number(a.isNew))
    }
    return products
  }, [rubrique, category, isNew, query, selectedBrands, selectedSizes, selectedPrice, sortBy, allProducts])

  const pageTitle = rubrique ? rubrique.name
    : rawQuery ? `« ${rawQuery} »`
    : category === 'streetwear' ? t.catalogue.streetwear
    : category === 'accessoires' ? t.catalogue.accessoires
    : isNew ? t.catalogue.nouveautes
    : t.catalogue.sneakers

  const activeCount = selectedBrands.length + selectedSizes.length + (selectedPrice !== null ? 1 : 0)
  const countLabel = `${filtered.length} ${filtered.length !== 1 ? t.catalogue.resultsPlural : t.catalogue.results}`
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (slug && !rubrique) {
    if (contentLoading) return <div className="container" style={{minHeight:'60vh'}} />
    return (
      <div className="container">
        <div className="empty" style={{paddingBlock:'8rem'}}>
          <p className="eyebrow" style={{marginBottom:'1rem'}}>404</p>
          <h1 className="display h-lg" style={{marginBottom:'2rem'}}>Rubrique introuvable</h1>
          <Link to="/catalogue" className="btn btn--solid">{t.sections.seeAllCatalogue}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <SEOHead
        path="/catalogue"
        titleFr="Catalogue sneakers — Jordan, Nike, Adidas, New Balance"
        titleEn="Sneakers catalogue — Jordan, Nike, Adidas, New Balance"
        descFr="Catalogue sneakers BKS — Jordan, Nike, Adidas, New Balance. Boutique à Dinan, Bretagne (30 min Saint-Malo). Livraison DHL France & Europe."
        descEn="BKS sneaker catalogue — Jordan, Nike, Adidas, New Balance. Shop in Dinan, Brittany (30 min from Saint-Malo). DHL delivery France & Europe."
      />
      <header className={`page-head ${rubrique?.coverUrl ? 'rubrique-head' : ''}`}>
        <div className={rubrique?.coverUrl ? 'rubrique-head__text' : ''}>
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link><span>/</span><span aria-current="page">{pageTitle}</span>
          </nav>
          <h1 className="display h-lg">{pageTitle}</h1>
          {rubrique?.coverUrl && <span className="rubrique-head__accent" aria-hidden="true" />}
          {rubrique?.description && <p className="lead">{rubrique.description}</p>}
        </div>
        {rubrique?.coverUrl && (
          <div className="rubrique-head__media"><SmartImage src={rubrique.coverUrl} alt={rubrique.name} loading="eager" /></div>
        )}
      </header>

      <div className="toolbar">
        <span>{countLabel}</span>
        <div style={{display:'flex', alignItems:'center', gap:'1.5rem'}}>
          <button className="filter-btn filter-btn--mobile" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={15} strokeWidth={1.5} />
            {t.catalogue.filters}{activeCount > 0 && ` (${activeCount})`}
          </button>
          <label style={{position:'relative', display:'inline-flex', alignItems:'center'}}>
            <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} aria-label="Trier">
              <option value="nouveautes">{t.catalogue.sort.new}</option>
              <option value="prix-asc">{t.catalogue.sort.priceAsc}</option>
              <option value="prix-desc">{t.catalogue.sort.priceDesc}</option>
            </select>
            <ChevronDown size={14} strokeWidth={1.5} style={{position:'absolute', right:0, pointerEvents:'none'}} />
          </label>
        </div>
      </div>

      <div className="catalog">
        <aside className={`filters ${filtersOpen ? 'is-open' : ''}`} aria-label={t.catalogue.filters}>
          {filtersOpen && (
            <div className="filters__top">
              <span className="eyebrow">{t.catalogue.filters}</span>
              <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Fermer"><X size={20} strokeWidth={1.4} /></button>
            </div>
          )}

          <div className="filter-group">
            <h3 className="eyebrow">{t.catalogue.brand}</h3>
            {BRANDS.map(brand => (
              <label key={brand} className="check">
                <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggle(selectedBrands, setSelectedBrands, brand)} />
                <span>{brand}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3 className="eyebrow">{t.catalogue.size}</h3>
            <div className="chips">
              {SIZES_ALL.map(size => (
                <button key={size} className={`chip ${selectedSizes.includes(size) ? 'is-active' : ''}`}
                  onClick={() => toggle(selectedSizes, setSelectedSizes, size)} aria-pressed={selectedSizes.includes(size)}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3 className="eyebrow">{t.catalogue.price}</h3>
            {t.catalogue.price_ranges.map((label, i) => (
              <label key={label} className="check">
                <input type="checkbox" checked={selectedPrice === i} onChange={() => setSelectedPrice(selectedPrice === i ? null : i)} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {activeCount > 0 && (
            <button className="link-arrow" style={{marginTop:'1.5rem'}} onClick={clearAll}>{t.catalogue.clearAll}</button>
          )}

          {filtersOpen && (
            <button className="btn btn--solid btn--block" style={{marginTop:'2rem'}} onClick={() => setFiltersOpen(false)}>
              {t.sections.seeAll} — {countLabel}
            </button>
          )}
        </aside>

        <div ref={gridRef}>
          {filtered.length === 0 ? (
            <div className="empty">
              <h2 className="display h-md">{t.catalogue.noResults}</h2>
              <p className="lead" style={{marginBottom:'2rem'}}>{t.catalogue.noResultsSub}</p>
              <button className="btn btn--outline" onClick={clearAll}>{t.catalogue.clearFilters}</button>
            </div>
          ) : productsLoading ? (
            <div className="pgrid">
              <ProductGridSkeleton count={12} />
            </div>
          ) : (
            <>
              <div className="pgrid">
                {paginated.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 6} />)}
              </div>
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Pages">
                  <button
                    className="pagination__btn"
                    onClick={() => { setPage(p => p - 1); scrollToGrid() }}
                    disabled={page === 1}
                    aria-label="Page précédente"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      className={`pagination__btn ${n === page ? 'is-active' : ''}`}
                      onClick={() => { setPage(n); scrollToGrid() }}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    className="pagination__btn"
                    onClick={() => { setPage(p => p + 1); scrollToGrid() }}
                    disabled={page === totalPages}
                    aria-label="Page suivante"
                  >
                    →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
