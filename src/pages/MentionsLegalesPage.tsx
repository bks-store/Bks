import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import { useTranslation } from '../i18n/useTranslation'

export default function MentionsLegalesPage() {
  const { t } = useTranslation()
  return (
    <div className="container">
      <SEOHead
        path="/mentions-legales"
        titleFr="Mentions légales"
        titleEn="Legal notices"
        noIndex
      />
      <header className="page-head">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <Link to="/">{t.nav.home}</Link><span>/</span><span aria-current="page">{t.mentions.title}</span>
        </nav>
        <h1 className="display h-xl">Mentions légales</h1>
      </header>

      <div className="prose" style={{ maxWidth: 720, paddingBottom: 'var(--section)' }}>

        <h2>Éditeur du site</h2>
        <p>
          BKS — Beau Kiosque de Soulier<br />
          Boutique indépendante de sneakers et chaussures<br />
          3 rue de la Chaux, 22100 Dinan, France<br />
          Responsable de la publication : Damien Holemy<br />
          Contact : <a href="mailto:bks@bks-store.com">bks@bks-store.com</a>
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted, #9E8E84)', lineHeight: 1.7 }}>
          SARL au capital de 3 000 € — SIRET 109 084 244 00010 — TVA FR61 109 084 244
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site bks-store.com est hébergé par :<br />
          Vercel Inc.<br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu de ce site (textes, photographies, logo, charte graphique) est la propriété exclusive de
          BKS — Beau Kiosque de Soulier ou de ses fournisseurs, et est protégé par les lois françaises et internationales
          relatives à la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans notre{' '}
          <Link to="/confidentialite">politique de confidentialité</Link>.
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site utilise des cookies techniques indispensables à son fonctionnement, ainsi que des cookies de mesure
          d'audience (Google Analytics) avec votre consentement. Vous pouvez gérer vos préférences via le bandeau
          affiché lors de votre première visite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          BKS s'efforce d'assurer l'exactitude et la mise à jour des informations publiées sur ce site. Toutefois,
          BKS ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations disponibles et décline
          toute responsabilité pour les erreurs ou omissions.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français
          sont seuls compétents.
        </p>
      </div>
    </div>
  )
}
