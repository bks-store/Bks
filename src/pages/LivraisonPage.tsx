import { Link } from 'react-router-dom'
import { ArrowRight, Truck } from 'lucide-react'
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
        descFr="Livraison DHL en France et en Europe. Retours sous 14 jours. Livraison offerte dès 150 €."
        descEn="DHL delivery in France and Europe. 14-day returns. Free delivery from €150."
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
        <p style={{ fontSize: '0.9375rem', opacity: 0.75 }}>{(l as any).freeFromSub}</p>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: 480 }}>
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
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{(l as any).deliveryTitle}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>{(l as any).deliverySub}</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--ink-soft)' }}>{(l as any).deliveryFree}</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>Offerte</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: 'var(--ink-soft)' }}>Standard</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>{(l as any).deliveryStd}</td>
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
          <p className="lead" style={{ marginBottom: '2.5rem' }}>{l.returnsSub}</p>

          <div style={{ display: 'grid', gap: '2rem' }}>

            {/* Conditions */}
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>{(l as any).returnsCondTitle}</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
                {((l as any).returnsCond as string[]).map((c: string) => (
                  <li key={c} style={{ fontSize: '0.9375rem', color: 'var(--ink)' }}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Étapes */}
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>{(l as any).returnsHowTitle}</p>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.6rem' }}>
                {((l as any).returnsSteps as string[]).map((s: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.6 }}>{s}</li>
                ))}
              </ol>
            </div>

            {/* Adresse */}
            <div style={{ background: 'var(--surface)', borderRadius: 6, padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>{(l as any).returnsAddrTitle}</p>
              {((l as any).returnsAddr as string[]).map((line: string) => (
                <p key={line} style={{ fontSize: '0.9375rem', color: 'var(--ink)', margin: '0.1rem 0', fontWeight: line.startsWith('BKS') ? 600 : 400 }}>{line}</p>
              ))}
            </div>

            {/* Frais */}
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', lineHeight: 1.65 }}>{(l as any).returnsCost}</p>

            <div>
              <a href="mailto:bks@bks-store.com" className="link-arrow">
                {l.returnsContact} <ArrowRight size={14} strokeWidth={1.6} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
