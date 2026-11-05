import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export default function CgvPage() {
  return (
    <div className="container">
      <SEOHead
        path="/cgv"
        titleFr="Conditions Générales de Vente"
        titleEn="Terms & Conditions"
        noIndex
      />
      <header className="page-head">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link><span>/</span><span aria-current="page">Conditions générales de vente</span>
        </nav>
        <h1 className="display h-xl">Conditions générales de vente</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: '0.5rem' }}>En vigueur au 1er janvier 2026</p>
      </header>

      <div className="prose" style={{ maxWidth: 720, paddingBottom: 'var(--section)' }}>

        <h2>Article 1 — Identification du vendeur</h2>
        <p>
          BKS — Beau Kiosque de Soulier<br />
          Boutique indépendante de sneakers et chaussures<br />
          3 rue de la Chaux, 22100 Dinan, France<br />
          Propriétaire : Damien Holemy<br />
          Contact : Instagram <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer">@b.k.s_dinan</a>
        </p>

        <h2>Article 2 — Objet</h2>
        <p>
          Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre BKS et tout acheteur
          effectuant un achat sur le site bks-store.com. Tout achat implique l'acceptation pleine et entière des présentes CGV.
        </p>

        <h2>Article 3 — Produits</h2>
        <p>
          Les produits proposés sont des sneakers, chaussures et articles streetwear. Ils sont décrits avec la plus grande
          exactitude possible. Les photographies sont contractuelles. BKS garantit l'authenticité de l'ensemble des produits vendus.
        </p>
        <p>
          Les disponibilités sont indiquées en temps réel dans la mesure du possible. En cas d'indisponibilité d'un produit après
          commande, BKS contacte le client dans les 48h pour proposer un remboursement intégral ou un échange.
        </p>

        <h2>Article 4 — Prix</h2>
        <p>
          Les prix sont indiqués en euros TTC (toutes taxes comprises). BKS se réserve le droit de modifier ses prix à tout moment.
          Le prix applicable est celui en vigueur au moment de la validation de la commande.
        </p>

        <h2>Article 5 — Commande</h2>
        <p>
          La commande est validée après confirmation du paiement. Un email de confirmation est envoyé à l'adresse indiquée par
          le client. BKS se réserve le droit d'annuler toute commande suspecte ou frauduleuse.
        </p>

        <h2>Article 6 — Paiement</h2>
        <p>
          Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, CB), Apple Pay ou Google Pay via la plateforme
          sécurisée Stripe. Les coordonnées bancaires ne transitent jamais par les serveurs de BKS. Toute commande n'est traitée
          qu'après confirmation de paiement par Stripe.
        </p>

        <h2>Article 7 — Livraison</h2>
        <p>
          Les commandes sont expédiées par Colissimo (La Poste) ou transporteur équivalent. Les délais indicatifs :
        </p>
        <ul>
          <li>France métropolitaine : 2 à 5 jours ouvrés</li>
          <li>Europe : 4 à 8 jours ouvrés</li>
          <li>International hors Europe : 7 à 14 jours ouvrés</li>
        </ul>
        <p>
          Les frais de livraison sont calculés à la commande selon le poids et la destination. BKS ne peut être tenu responsable
          des retards imputables au transporteur.
        </p>

        <h2>Article 8 — Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai de <strong>14 jours</strong> à
          compter de la réception du colis pour exercer son droit de rétractation, sans justification. Les produits doivent être
          retournés dans leur état d'origine (non portés, boîte intacte). Les frais de retour sont à la charge du client sauf
          erreur de BKS.
        </p>
        <p>
          Pour exercer ce droit, contacter BKS via Instagram <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer">@b.k.s_dinan</a> ou
          en se rendant directement en boutique.
        </p>

        <h2>Article 9 — Garanties</h2>
        <p>
          Tous les produits bénéficient de la garantie légale de conformité (articles L217-4 à L217-14 du Code de la consommation)
          et de la garantie contre les vices cachés (articles 1641 à 1648 du Code civil).
        </p>

        <h2>Article 10 — Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site (textes, images, logo, design) est la propriété de BKS ou de ses partenaires.
          Toute reproduction sans autorisation est interdite.
        </p>

        <h2>Article 11 — Responsabilité</h2>
        <p>
          BKS ne saurait être tenu responsable des dommages indirects résultant de l'utilisation des produits ou du site.
          La responsabilité de BKS est en tout état de cause limitée au montant de la commande en cause.
        </p>

        <h2>Article 12 — Litiges</h2>
        <p>
          En cas de litige, le client peut contacter BKS directement pour trouver une solution amiable. À défaut, les tribunaux
          de Saint-Brieuc (22) seront compétents. Le droit applicable est le droit français.
        </p>
        <p>
          Le client peut également recourir à la plateforme européenne de règlement en ligne des litiges :{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
        </p>

      </div>
    </div>
  )
}
