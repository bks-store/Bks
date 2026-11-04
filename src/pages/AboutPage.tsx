import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Clock } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import SmartImage from '../components/SmartImage'
import { useContent } from '../context/ContentContext'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead, { LOCAL_BUSINESS_SCHEMA } from '../components/SEOHead'
import { IMAGES } from '../config/images'

export default function AboutPage() {
  const { t } = useTranslation()
  const { media, content } = useContent()
  const photos = content.storePhotos

  return (
    <>
      <SEOHead
        path="/a-propos"
        titleFr="À propos — L'histoire de BKS et de Damien"
        titleEn="About — The story of BKS and Damien"
        descFr="Damien Holemy a fondé BKS à Dinan par passion pour les sneakers depuis l'enfance. Découvrez l'histoire de la boutique et sa philosophie."
        descEn="Damien Holemy founded BKS in Dinan out of a lifelong passion for sneakers. Discover the story behind the shop and its philosophy."
        schema={LOCAL_BUSINESS_SCHEMA}
      />

      {/* ── Hero sombre split ── */}
      <section style={{
        background: 'var(--bks-brun-profond)',
        color: 'var(--bks-creme)',
        display: 'grid',
        gridTemplateColumns: '1fr',
        minHeight: 'clamp(420px, 55vw, 640px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <style>{`
          @media (min-width: 768px) {
            .about-hero-grid { grid-template-columns: 1fr 1fr !important; }
            .about-hero-img { display: block !important; }
          }
        `}</style>
        <div className="about-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          width: '100%',
          maxWidth: 'var(--container)',
          margin: '0 auto',
          paddingInline: 'var(--gutter)',
        }}>
          {/* Texte */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: 'clamp(2rem, 4vw, 3rem)',
            paddingBottom: 'clamp(2rem, 5vw, 3.5rem)',
            paddingRight: 'clamp(0px, 4vw, 3rem)',
          }}>
            <nav className="crumbs" style={{ marginBottom: '2rem', opacity: 0.5 }} aria-label="Fil d'Ariane">
              <Link to="/" style={{ color: 'var(--bks-creme)' }}>Accueil</Link>
              <span style={{ margin: '0 0.5rem' }}>/</span>
              <span aria-current="page" style={{ color: 'var(--bks-creme)' }}>{t.footer.about}</span>
            </nav>
            <p className="eyebrow" style={{ color: 'var(--bks-bronze)', marginBottom: '1.25rem' }}>
              Beau Kiosque de Soulier — Dinan
            </p>
            <h1 className="display h-xl" style={{ color: 'var(--bks-creme)', marginBottom: '2rem' }}>
              {t.about.title1}<br /><em style={{ color: 'var(--bks-bronze)' }}>{t.about.title2}</em>
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 1.1vw, 1.0625rem)',
              lineHeight: 1.75,
              color: 'rgba(244,239,230,0.65)',
              maxWidth: '32rem',
              marginBottom: '2.5rem',
            }}>
              Une boutique indépendante née d'une passion. Chaque paire, choisie à la main par Damien.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'rgba(244,239,230,0.5)' }}>
                <MapPin size={13} strokeWidth={1.5} /> 3 rue de la Chaux, Dinan
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'rgba(244,239,230,0.5)' }}>
                <Clock size={13} strokeWidth={1.5} /> Lun–Sam
              </span>
            </div>
          </div>

          {/* Photo */}
          <div className="about-hero-img" style={{
            display: 'none',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <SmartImage
              src={media('about')}
              alt="La boutique BKS à Dinan"
              loading="eager"
              className="hero-slide-img"
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, var(--bks-brun-profond) 0%, transparent 20%)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </section>

      {/* ── Histoire ── */}
      <section className="section bg-surface-2">
        <div className="container split">
          <div className="prose-bks split__main">
            <p>BKS — <em>Beau Kiosque de Soulier</em> — est une boutique indépendante de sneakers et de chaussures rares, fondée à Dinan par Damien Holemy.</p>
            <p>Tout commence au début des années 2000 : Damien, une dizaine d'années, regarde un clip de 50 Cent à la télé. Des Air Force 1 aux pieds. C'est le déclic. Depuis, la passion pour les chaussures ne l'a plus quitté.</p>
            <p>Après des années en Angleterre dans le commerce international, il s'installe à Dinan en 2021. Au printemps 2026, il décide de concrétiser son projet : « Le style de chaussures que j'achète, on les trouve que chez les indépendants, à Rennes ou à Saint-Brieuc. Je me suis dit qu'il fallait faire quelque chose ici. »</p>
            <p>Résultat : un espace chaleureux, une dominance de bois, une touche américaine. À l'entrée, le maillot de Kobe Bryant. Dans les rayons, des Jordan, des Air Max, des UGG — des paires qu'on ne trouve pas ailleurs.</p>
            <blockquote className="brand__quote" style={{ borderColor: 'var(--accent)', marginTop: '2rem' }}>
              <p style={{ color: 'var(--ink)' }}>« On essaye de proposer la perle rare. Je choisis chaque modèle, un par un. »</p>
              <footer style={{ color: 'var(--ink-soft)' }}>Damien Holemy, fondateur</footer>
            </blockquote>
          </div>

          {/* Info pratique */}
          <aside className="split__side">
            <div style={{
              background: 'var(--bks-brun-profond)',
              borderRadius: '6px',
              padding: '1.75rem',
              color: 'var(--bks-creme)',
            }}>
              <img src={IMAGES.logo.onDark} alt="BKS" style={{ height: 36, width: 'auto', marginBottom: '1.75rem', opacity: 0.9 }} />
              <p className="eyebrow" style={{ color: 'var(--bks-bronze)', marginBottom: '1.5rem' }}>{t.about.practical}</p>
              <dl style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <dt style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.4)', marginBottom: '0.5rem' }}>{t.about.address}</dt>
                  <dd style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'rgba(244,239,230,0.85)' }}>3 rue de la Chaux<br />22100 Dinan</dd>
                </div>
                <div style={{ borderTop: '1px solid rgba(244,239,230,0.1)', paddingTop: '1.25rem' }}>
                  <dt style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.4)', marginBottom: '0.5rem' }}>{t.about.hours}</dt>
                  <dd style={{ fontSize: '0.9375rem', lineHeight: 1.8, color: 'rgba(244,239,230,0.85)' }}>
                    {t.about.mon}<br />
                    {t.about.tueThur}<br />
                    {t.about.wedFriSat}<br />
                    <span style={{ color: 'rgba(244,239,230,0.4)', fontSize: '0.875rem' }}>{t.about.closed}</span>
                  </dd>
                </div>
                <div style={{ borderTop: '1px solid rgba(244,239,230,0.1)', paddingTop: '1.25rem' }}>
                  <dt style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.4)', marginBottom: '0.5rem' }}>{t.about.social}</dt>
                  <dd>
                    <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'rgba(244,239,230,0.85)' }}>
                      <InstagramIcon size={14} /> @b.k.s_dinan
                    </a>
                  </dd>
                </div>
              </dl>
              <Link to="/catalogue" className="btn btn--solid" style={{ marginTop: '1.75rem', width: '100%', justifyContent: 'center' }}>
                {t.home.hero.cta} <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Galerie boutique ── */}
      {photos.length > 0 && (
        <section className="section bg-deep">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">3 rue de la Chaux, Dinan</p>
                <h2 className="display h-lg">La boutique <em>en images</em></h2>
              </div>
            </div>
            <div className="gallery">
              {photos.map((p, i) => (
                <figure key={p.id} className={`gallery__item ${i % 5 === 0 ? 'gallery__item--wide' : ''}`}>
                  <div className="media"><SmartImage src={p.url} alt={p.caption || 'La boutique BKS à Dinan'} /></div>
                  {p.caption && <figcaption>{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
