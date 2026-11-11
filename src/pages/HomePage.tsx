import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Clock } from 'lucide-react'
import SEOHead, { LOCAL_BUSINESS_SCHEMA, FAQ_SCHEMA } from '../components/SEOHead'
import { useState, useEffect, useCallback } from 'react'
import ProductCard from '../components/ProductCard'
import SmartImage from '../components/SmartImage'
import type { Product } from '../data/products'
import { useProducts } from '../context/ProductsContext'
import { IMAGES } from '../config/images'
import { useTranslation } from '../i18n/useTranslation'
import { useContent } from '../context/ContentContext'
import { MEDIA_SLOTS } from '../lib/content'

const INSTAGRAM_URL = 'https://www.instagram.com/b.k.s_dinan/'
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=3+rue+de+la+Chaux+22100+Dinan'

function Hero() {
  const { t } = useTranslation()
  const h = t.home.hero
  const { media } = useContent()

  const slides = [
    media('hero'),
    media('hero-2'),
    media('hero-3'),
    media('hero-4'),
  ].filter(Boolean)

  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [next, slides.length])

  return (
    <section className="hero">
      <div className="hero__intro">
        <p className="eyebrow reveal">{h.eyebrow}</p>
        <h1 className="display h-xl reveal reveal-2">
          {h.title1}<br /><em>{h.title2}</em>
        </h1>
      </div>

      <div className="hero__media media" style={{position:'relative', overflow:'hidden'}}>
        {slides.map((src, i) => (
          <div
            key={src}
            className={i === current ? 'slide-active' : undefined}
            style={{
              position: i === 0 ? 'relative' : 'absolute',
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.8s ease',
              width: '100%',
              height: '100%',
            }}
          >
            <SmartImage
              key={i === current ? 'kb-active' : `kb-${i}`}
              src={src}
              alt="Paire de sneakers"
              loading={i === 0 ? 'eager' : 'lazy'}
              className="hero-slide-img"
            />
          </div>
        ))}
        {slides.length > 1 && (
          <div style={{
            position:'absolute', bottom:'0.75rem', left:'50%', transform:'translateX(-50%)',
            display:'flex', gap:'0.4rem', zIndex:2,
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Photo ${i + 1}`}
                style={{
                  width: i === current ? '1.5rem' : '0.4rem',
                  height: '0.4rem',
                  borderRadius: '999px',
                  background: i === current ? 'var(--bks-creme)' : 'rgba(255,255,255,0.45)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hero__body reveal reveal-3">
        <p className="lead">{h.text}</p>
        <div className="hero__actions">
          <Link to="/catalogue" className="btn btn--solid">
            {h.cta} <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <Link to="/a-propos" className="link-arrow">{h.secondary}</Link>
        </div>
        <div className="hero__meta">
          <span><MapPin size={14} strokeWidth={1.5} /> {h.metaPlace}</span>
          <span><Clock size={14} strokeWidth={1.5} /> {h.metaDays}</span>
        </div>
      </div>
    </section>
  )
}

const BRANDS = [
  'Nike', 'Jordan', 'Adidas', 'New Balance', 'Saucony', 'UGG', 'Timberland', 'ASICS',
]

function BrandsStrip() {
  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
      padding: '1.25rem 0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0 2.5rem',
        paddingInline: 'var(--gutter)',
        maxWidth: 'var(--container)',
        margin: '0 auto',
      }}>
        {BRANDS.map((brand, i) => (
          <span key={brand} style={{
            fontFamily: 'var(--ff-body)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            opacity: 0.5 + (i % 2) * 0.2,
            whiteSpace: 'nowrap',
          }}>
            {brand}
          </span>
        ))}
      </div>
    </div>
  )
}


function ProductRow({ eyebrow, title, products, link, linkLabel, tone, cols, priority }: {
  eyebrow: string; title: string; products: Product[]; link: string; linkLabel: string
  tone: 'surface' | 'surface-2'; cols: 3 | 4; priority?: boolean
}) {
  return (
    <section className={`section bg-${tone}`}>
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display h-lg">{title}</h2>
          </div>
          <Link to={link} className="link-arrow">{linkLabel} <ArrowRight size={14} strokeWidth={1.6} /></Link>
        </div>
        <div className={`pgrid pgrid--rail ${cols === 4 ? 'pgrid--4' : ''}`}>
          {products.map(p => <ProductCard key={p.id} product={p} priority={priority} />)}
        </div>
      </div>
    </section>
  )
}

function Brand() {
  const { t } = useTranslation()
  const b = t.home.brand
  const { media } = useContent()
  return (
    <section className="section bg-deep">
      <div className="container brand">
        <div className="brand__media media">
          <SmartImage src={media('brand')} alt="Damien, fondateur de BKS" />
        </div>
        <div className="brand__text">
          <img src={IMAGES.logo.onDark} alt="" aria-hidden="true" className="brand__logo" />
          <p className="eyebrow">{b.eyebrow}</p>
          <h2 className="display h-md">{b.title1}<br /><em>{b.title2}</em></h2>
          <p className="lead">{b.p1}</p>
          <p className="lead">{b.p2}</p>
          <blockquote className="brand__quote">
            <p>{b.quote}</p>
            <footer>{b.author}</footer>
          </blockquote>
          <Link to="/a-propos" className="link-arrow">{b.cta} <ArrowRight size={14} strokeWidth={1.6} /></Link>
        </div>
      </div>
    </section>
  )
}

function Store() {
  const { t } = useTranslation()
  const s = t.home.store
  const { media } = useContent()
  return (
    <section className="section bg-surface">
      <div className="container store">
        <div className="store__media media">
          <SmartImage src={media('store')} alt="Sneakers en cuir exposées en boutique" />
        </div>
        <div className="store__info">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 className="display h-lg">{s.title1}<br /><em>{s.title2}</em></h2>
          <p className="lead">{s.text}</p>
          <dl className="store__list">
            <div className="store__row">
              <dt>{s.address}</dt>
              <dd>3 rue de la Chaux<br />22100 Dinan</dd>
            </div>
            <div className="store__row">
              <dt>{s.hours}</dt>
              <dd>{t.footer.hours.mon}<br />{t.footer.hours.tueThur}<br />{t.footer.hours.wedFriSat}</dd>
            </div>
          </dl>
          <div className="store__actions">
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--solid">
              {s.directions} <ArrowRight size={16} strokeWidth={1.5} />
            </a>
            <Link to="/a-propos" className="link-arrow">{s.practical}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Instagram() {
  const { t } = useTranslation()
  const i = t.home.instagram
  const { media } = useContent()
  return (
    <section className="section bg-surface-2">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">{i.eyebrow}</p>
            <h2 className="display h-md">{i.title}</h2>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link-arrow">
            {i.cta} <ArrowRight size={14} strokeWidth={1.6} />
          </a>
        </div>
        <div className="insta">
          {MEDIA_SLOTS.filter(k => k.startsWith('instagram')).map((k, idx) => {
            const src = media(k)
            if (!src) return null
            return (
              <a key={k} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={`${i.cta} (${idx + 1})`}>
                <div className="media"><SmartImage src={src} alt="" /></div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const { products } = useProducts()
  const nouveautes = products.filter(p => p.isNew && p.images.length > 0)
  const featured = products.filter(p => p.isFeatured && p.images.length > 0)

  return (
    <>
      <SEOHead
        path="/"
        titleFr="Sneakers &amp; Streetwear à Dinan"
        titleEn="Sneakers &amp; Streetwear in Dinan, France"
        descFr="Boutique sneakers à Dinan, Bretagne — Jordan, Nike, Adidas, New Balance. À 30 min de Saint-Malo et Saint-Brieuc. Sélection à la main. Livraison DHL France & Europe dès 5,90 €."
        descEn="Sneaker boutique in Dinan, Brittany — Jordan, Nike, Adidas, New Balance. 30 min from Saint-Malo. Hand-picked selection. DHL delivery France & Europe from €5.90."
        schema={[LOCAL_BUSINESS_SCHEMA, FAQ_SCHEMA]}
      />
      <Hero />
      <BrandsStrip />
      {nouveautes.length > 0 && (
        <ProductRow
          eyebrow={t.home.newEyebrow}
          title={t.sections.nouveautes}
          products={nouveautes}
          link="/catalogue?nouveau=true"
          linkLabel={t.sections.seeAllNew}
          tone="surface-2"
          cols={3}
          priority
        />
      )}
      <Brand />
      {featured.length > 0 && (
        <ProductRow
          eyebrow={t.home.featuredEyebrow}
          title={t.sections.featured}
          products={featured}
          link="/catalogue"
          linkLabel={t.sections.seeAllCatalogue}
          tone="surface"
          cols={4}
          priority
        />
      )}
      <Store />
      <Instagram />
    </>
  )
}
