import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export default function ConfidentialitePage() {
  return (
    <div className="container">
      <SEOHead
        path="/confidentialite"
        titleFr="Politique de confidentialité — BKS"
        titleEn="Privacy Policy — BKS"
        noIndex
      />
      <header className="page-head">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link><span>/</span><span aria-current="page">Politique de confidentialité</span>
        </nav>
        <h1 className="display h-xl">Politique de confidentialité</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: '0.5rem' }}>Conformément au RGPD (Règlement UE 2016/679) — en vigueur au 1er janvier 2026</p>
      </header>

      <div className="prose" style={{ maxWidth: 720, paddingBottom: 'var(--section)' }}>

        <h2>1. Responsable du traitement</h2>
        <p>
          BKS — Beau Kiosque de Soulier<br />
          3 rue de la Chaux, 22100 Dinan, France<br />
          Propriétaire : Damien Holemy<br />
          Contact : <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer">@b.k.s_dinan</a> sur Instagram
        </p>

        <h2>2. Données collectées</h2>
        <p>BKS collecte uniquement les données nécessaires au traitement des commandes et à la relation client :</p>
        <ul>
          <li><strong>Données de commande :</strong> nom, prénom, adresse email, adresse de livraison, téléphone (optionnel)</li>
          <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe — BKS n'a jamais accès aux numéros de carte</li>
          <li><strong>Données de compte :</strong> si vous créez un compte, email, prénom, nom et historique de commandes</li>
          <li><strong>Données de navigation :</strong> cookies techniques nécessaires au fonctionnement du site uniquement</li>
        </ul>

        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Traitement et expédition des commandes</li>
          <li>Envoi des emails transactionnels (confirmation, expédition)</li>
          <li>Gestion des comptes clients</li>
          <li>Service après-vente et gestion des retours</li>
          <li>Amélioration du site (statistiques anonymes uniquement si consentement)</li>
        </ul>

        <h2>4. Base légale</h2>
        <p>
          Le traitement des données de commande est fondé sur l'<strong>exécution du contrat</strong> (article 6.1.b du RGPD).
          Le traitement à des fins marketing (newsletter) est fondé sur votre <strong>consentement</strong> (article 6.1.a).
        </p>

        <h2>5. Durée de conservation</h2>
        <ul>
          <li>Données de commande : 5 ans (obligation légale comptable)</li>
          <li>Données de compte : jusqu'à la suppression du compte + 1 an</li>
          <li>Données marketing : jusqu'au retrait du consentement</li>
        </ul>

        <h2>6. Destinataires des données</h2>
        <p>Les données sont transmises uniquement aux prestataires nécessaires :</p>
        <ul>
          <li><strong>Stripe</strong> (paiement) — <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité Stripe</a></li>
          <li><strong>Supabase</strong> (hébergement base de données, serveurs en Europe) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">politique Supabase</a></li>
          <li><strong>Colissimo / transporteur</strong> (livraison) — nom, prénom, adresse uniquement</li>
        </ul>
        <p>Aucune donnée n'est vendue ni transmise à des tiers à des fins publicitaires.</p>

        <h2>7. Vos droits (RGPD)</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : supprimer votre compte et vos données</li>
          <li><strong>Droit d'opposition</strong> : vous opposer au traitement à des fins marketing</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous via Instagram{' '}
          <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer">@b.k.s_dinan</a>.
          Réponse sous 30 jours. Vous pouvez également adresser une réclamation à la{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
        </p>

        <h2>8. Cookies</h2>
        <p>Le site utilise :</p>
        <ul>
          <li><strong>Cookies techniques essentiels</strong> : nécessaires au fonctionnement (panier, session) — pas de consentement requis</li>
          <li><strong>Cookies analytiques</strong> (Google Analytics) : uniquement avec votre consentement explicite</li>
        </ul>
        <p>
          Vous pouvez modifier vos préférences à tout moment en cliquant sur "Gérer les cookies" en bas de page.
        </p>

        <h2>9. Sécurité</h2>
        <p>
          Les données sont hébergées sur des serveurs sécurisés en Europe (Supabase). Les communications sont chiffrées via HTTPS.
          Les paiements sont traités par Stripe (certifié PCI DSS niveau 1).
        </p>

        <h2>10. Modifications</h2>
        <p>
          Cette politique peut être mise à jour. La version en vigueur est toujours disponible sur cette page.
        </p>

      </div>
    </div>
  )
}
