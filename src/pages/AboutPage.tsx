import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import SmartImage from '../components/SmartImage'
import { useContent } from '../context/ContentContext'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead, { LOCAL_BUSINESS_SCHEMA } from '../components/SEOHead'

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
      <div className="container">
        <header className="page-head">
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link><span>/</span><span aria-current="page">{t.footer.about}</span>
          </nav>
          <p className="eyebrow" style={{marginBottom:'1.25rem'}}>Beau Kiosque de Soulier — Dinan</p>
          <h1 className="display h-xl">{t.about.title1}<br /><em>{t.about.title2}</em></h1>
        </header>
        <div className="media" style={{aspectRatio:'16 / 8'}}>
          <SmartImage src={media('about')} alt="Sneakers en cuir exposées en boutique" loading="eager" />
        </div>
      </div>

      <section className="section">
        <div className="container split">
          <div className="prose-bks split__main">
            <p>BKS — <em>Beau Kiosque de Soulier</em> — est une boutique indépendante de sneakers et de chaussures rares, fondée à Dinan par Damien Holemy. Ouverture le 19 septembre 2026.</p>
            <p>Tout commence au début des années 2000 : Damien, une dizaine d'années, regarde un clip de 50 Cent à la télé. Des Air Force 1 aux pieds. C'est le déclic. Depuis, la passion pour les chaussures ne l'a plus quitté.</p>
            <p>Après des années en Angleterre dans le commerce international, il s'installe à Dinan en 2021. Au printemps 2026, il décide de concrétiser son projet : « Le style de chaussures que j'achète, on les trouve que chez les indépendants, à Rennes ou à Saint-Brieuc. Je me suis dit qu'il fallait faire quelque chose ici. »</p>
            <p>Résultat : un espace chaleureux, une dominance de bois, une touche américaine. À l'entrée, le maillot de Kobe Bryant. Dans les rayons, des Jordan, des Air Max, des UGG — des paires qu'on ne trouve pas ailleurs.</p>
            <blockquote className="brand__quote" style={{borderColor:'var(--accent)'}}>
              <p style={{color:'var(--ink)'}}>« On essaye de proposer la perle rare. Je choisis chaque modèle, un par un. »</p>
              <footer style={{color:'var(--ink-soft)'}}>Damien Holemy, fondateur</footer>
            </blockquote>
          </div>

          <aside className="split__side">
            <p className="eyebrow">{t.about.practical}</p>
            <dl className="store__list" style={{marginTop:'1.5rem'}}>
              <div className="store__row"><dt>{t.about.address}</dt><dd>3 rue de la Chaux<br />22100 Dinan<br />Côtes-d'Armor</dd></div>
              <div className="store__row"><dt>{t.about.hours}</dt><dd>{t.about.mon}<br />{t.about.tueThur}<br />{t.about.wedFriSat}<br /><span style={{color:'var(--ink-soft)'}}>{t.about.closed}</span></dd></div>
              <div className="store__row"><dt>{t.about.social}</dt><dd>
                <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                  <InstagramIcon size={14} /> @b.k.s_dinan
                </a>
              </dd></div>
            </dl>
            <Link to="/catalogue" className="btn btn--solid">{t.home.hero.cta} <ArrowRight size={16} strokeWidth={1.5} /></Link>
          </aside>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section bg-surface-2">
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
