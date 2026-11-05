import { Link } from 'react-router-dom'
import { ArrowRight, Package, Truck } from 'lucide-react'
import SEOHead from '../components/SEOHead'
import { useTranslation } from '../i18n/useTranslation'

export default function LivraisonPage() {
  const { t } = useTranslation()
  const l = t.livraison

  return (
    <>
      <SEOHead
        path="/livraison"
        titleFr="Livraison & retours"
        titleEn="Delivery & returns"
        descFr="Livraison Colissimo en France et en Europe. Retours sous 14 jours. Livraison offerte dès 150 € en France."
        descEn="Colissimo delivery in France and Europe. 14-day returns. Free delivery from €150 in France."
      />
      <div className="container">
        <header className="page-head">
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link><span>/</span><span aria-current="page">{l.title}</span>
          </nav>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>{l.eyebrow}</p>
          <h1 className="display h-xl">{l.title}</h1>
        </header>
      </div>

      {/* Bandeau livraison offerte */}
      <div style={{
        background: 'var(--bks-brun-profond)',
        color: 'var(--bks-creme)',
        padding: '1.75rem var(--gutter)',
        textAlign: 'center',
      }}>
        <p className="eyebrow" style={{ color: 'var(--bks-bronze)', marginBottom: '0.4rem' }}>{l.freeFrom}</p>
        <p style={{ fontSize: '0.9375rem', opacity: 0.75 }}>{l.freeFromSub}</p>
      </div>

      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {/* France */}
            <div style={{
              padding: '1.75rem',
              border: '1px solid var(--line-strong)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ color: 'var(--accent)' }}><Truck size={22} strokeWidth={1.5} /></div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{l.france}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>{l.franceSub}</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--ink-soft)' }}>Dès 150 €</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>Offerte</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: 'var(--ink-soft)' }}>Standard</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>{l.franceStd}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Europe */}
            <div style={{
              padding: '1.75rem',
              border: '1px solid var(--line-strong)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ color: 'var(--accent)' }}><Package size={22} strokeWidth={1.5} /></div>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{l.europe}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>{l.europeSub}</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: 'var(--ink-soft)' }}>Standard</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>{l.europeStd}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface-2">
        <div className="container" style={{ maxWidth: 680 }}>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>{l.returnsTitle}</p>
          <h2 className="display h-md" style={{ marginBottom: '1.5rem' }}>{l.returnsTitle}</h2>
          <p className="lead" style={{ marginBottom: '2rem' }}>{l.returnsSub}</p>
          <a
            href="https://www.instagram.com/b.k.s_dinan/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow"
          >
            {l.returnsContact} <ArrowRight size={14} strokeWidth={1.6} />
          </a>
        </div>
      </section>
    </>
  )
}
