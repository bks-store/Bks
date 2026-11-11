import { Helmet } from 'react-helmet-async'
import { useTranslation } from '../i18n/useTranslation'

// ── Configuration SEO globale ─────────────────────────────────────────────────
export const SITE_URL = 'https://www.bks-store.com'  // ← mettre à jour avec votre domaine
export const SITE_NAME = 'BKS'
export const SITE_NAME_FULL = 'BKS — Sneakers & Streetwear'

const DEFAULT_OG_IMAGE = `${SITE_URL}/images/brand/logo-bks-3d-clean.png`

// ── Descriptions par défaut (FR / EN) ─────────────────────────────────────────
const DEFAULT_DESC: Record<string, string> = {
  fr: 'Boutique sneakers à Dinan, Bretagne — Jordan, Nike, Adidas, New Balance. À 30 min de Saint-Malo. Sélection à la main par Damien. Livraison DHL France & Europe.',
  en: 'Sneaker boutique in Dinan, Brittany — Jordan, Nike, Adidas, New Balance. 30 min from Saint-Malo. Hand-picked by Damien. DHL shipping France & Europe.',
}

interface SEOProps {
  // Titre de la page (sans suffixe BKS — il est ajouté automatiquement)
  titleFr?: string
  titleEn?: string
  // Description (surcharge le défaut)
  descFr?: string
  descEn?: string
  // Path de la page (ex: '/catalogue', '/produit/dunk-low-grey')
  path?: string
  // Image OG (URL absolue)
  image?: string
  // Type de page pour OG
  type?: 'website' | 'product' | 'article'
  // JSON-LD Schema.org (objet complet)
  schema?: object | object[]
  // Empêcher l'indexation (admin, panier…)
  noIndex?: boolean
}

export default function SEOHead({
  titleFr,
  titleEn,
  descFr,
  descEn,
  path = '',
  image,
  type = 'website',
  schema,
  noIndex = false,
}: SEOProps) {
  const { locale } = useTranslation()
  const isFr = locale === 'fr'

  const rawTitle = isFr ? (titleFr ?? SITE_NAME_FULL) : (titleEn ?? SITE_NAME_FULL)
  const pageTitle = rawTitle === SITE_NAME_FULL
    ? rawTitle
    : `${rawTitle} — ${SITE_NAME_FULL}`

  const description = isFr
    ? (descFr ?? DEFAULT_DESC.fr)
    : (descEn ?? DEFAULT_DESC.en)

  const canonical = `${SITE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE

  const schemaArray = schema
    ? Array.isArray(schema) ? schema : [schema]
    : []

  return (
    <Helmet>
      {/* ── Base ── */}
      <html lang={isFr ? 'fr' : 'en'} />
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── hreflang — même URL sert FR et EN ── */}
      <link rel="alternate" hrefLang="fr" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path}`} />

      {/* ── Open Graph ── */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME_FULL} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={isFr ? 'fr_FR' : 'en_GB'} />
      <meta property="og:locale:alternate" content={isFr ? 'en_GB' : 'fr_FR'} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* ── JSON-LD ── */}
      {schemaArray.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  )
}

// ── Schemas réutilisables ─────────────────────────────────────────────────────

export const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'BKS — Beau Kiosque de Soulier',
  alternateName: ['BKS Dinan', 'BKS sneakers', 'Beau Kiosque de Soulier'],
  url: SITE_URL,
  logo: `${SITE_URL}/images/brand/logo-bks-3d-clean.png`,
  image: `${SITE_URL}/images/brand/logo-bks-3d-clean.png`,
  description: 'Boutique indépendante de sneakers et chaussures à Dinan, Bretagne. À 30 minutes de Saint-Malo et Saint-Brieuc. Sélection Jordan, Nike, Adidas, New Balance par Damien.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '3 rue de la Chaux',
    addressLocality: 'Dinan',
    postalCode: '22100',
    addressCountry: 'FR',
    addressRegion: 'Bretagne',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.4543,
    longitude: -2.0424,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday'],
      opens: '14:00',
      closes: '18:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Thursday'],
      opens: '11:00',
      closes: '18:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Wednesday', 'Friday', 'Saturday'],
      opens: '11:00',
      closes: '19:00',
    },
  ],
  telephone: '',
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Credit Card, Cash',
  sameAs: [
    'https://www.instagram.com/b.k.s_dinan/',
  ],
}

export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Où acheter des sneakers à Dinan ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS (Beau Kiosque de Soulier) est une boutique de sneakers indépendante au 3 rue de la Chaux, 22100 Dinan. Vous y trouverez une sélection exclusive de Jordan, Nike, Adidas et New Balance, choisie à la main par Damien.',
      },
    },
    {
      '@type': 'Question',
      name: 'Où acheter des sneakers près de Saint-Malo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS Dinan est la boutique de sneakers la plus proche de Saint-Malo (30 minutes). Au 3 rue de la Chaux, 22100 Dinan, vous trouverez Jordan, Nike, Adidas et New Balance sélectionnés à la main. Commande en ligne avec livraison DHL partout en France.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quelle boutique de chaussures à Dinan Bretagne ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS — Beau Kiosque de Soulier est la seule boutique de sneakers indépendante de Dinan. Située au cœur de la cité médiévale, elle propose des sneakers et chaussures streetwear Jordan, Nike, Adidas, New Balance, Timberland et UGG.',
      },
    },
    {
      '@type': 'Question',
      name: "BKS fait-il des livraisons en France et en Europe ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, BKS livre en France et en Europe par DHL en 5 à 8 jours ouvrés. La livraison est offerte dès 150 €. Commandez en ligne sur bks-store.com.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quelles marques de sneakers trouve-t-on chez BKS Dinan ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS propose des sneakers Jordan, Nike, Adidas, New Balance, Timberland, UGG, Saucony et ASICS. La boutique se spécialise dans les éditions limitées et les modèles exclusifs sélectionnés à la main.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels sont les horaires de la boutique BKS à Dinan ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS est ouverte le lundi de 14h à 18h30, le mardi et jeudi de 11h à 18h30, et le mercredi, vendredi et samedi de 11h à 19h. La boutique est fermée le dimanche.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment trouver la boutique de sneakers BKS en Bretagne ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BKS se trouve au cœur de la cité médiévale de Dinan en Bretagne, au 3 rue de la Chaux, 22100 Dinan. Facile d\'accès depuis Saint-Malo (30 min), Rennes (1h) et Saint-Brieuc (45 min). Parking disponible à proximité.',
      },
    },
  ],
}

export function buildProductSchema(product: {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  description?: string
  images: string[]
  sizes: { size: string; available: boolean }[]
}) {
  const inStock = product.sizes.some(s => s.available)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description ?? '',
    image: product.images.map(img =>
      img.startsWith('http') ? img : `${SITE_URL}${img}`
    ),
    url: `${SITE_URL}/produit/${(product as { slug?: string }).slug ?? product.id}`,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'EUR',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'BKS Dinan' },
      priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    },
  }
}
