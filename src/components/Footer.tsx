import { Link } from 'react-router-dom'
import InstagramIcon from './InstagramIcon'
import { useTranslation } from '../i18n/useTranslation'
import { IMAGES } from '../config/images'
import { useContent } from '../context/ContentContext'

const FacebookIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const LinkedInIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

export default function Footer() {
  const { t } = useTranslation()
  const { visibleRubriques } = useContent()
  const columns = [
    {
      title: t.footer.catalogue,
      links: [
        { to: '/catalogue', label: t.footer.all },
        ...visibleRubriques.map(r => ({ to: `/rubrique/${r.slug}`, label: r.name })),
      ],
    },
    {
      title: t.footer.info,
      links: [
        { to: '/a-propos', label: t.footer.about },
        { to: '/contact', label: t.footer.contact },
        { to: '/livraison', label: t.footer.delivery },
        { to: '/cgv', label: t.footer.cgv },
        { to: '/confidentialite', label: t.footer.privacy },
        { to: '/mentions-legales', label: t.footer.legal },
      ],
    },
  ]

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <img src={IMAGES.logo.onDark} alt="BKS" className="site-footer__logo" width={1294} height={885} />
            <p className="site-footer__desc">{t.footer.desc}</p>
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.75rem'}}>
              <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex', alignItems:'center', gap:'0.6rem'}}>
                <InstagramIcon size={15} /> @b.k.s_dinan
              </a>
              <a href="https://www.facebook.com/p/BKS-Beau-Kiosque-de-Soulier-61593872704384/" target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex', alignItems:'center', gap:'0.6rem'}}>
                <FacebookIcon size={15} /> BKS — Beau Kiosque de Soulier
              </a>
              <a href="https://www.linkedin.com/company/beau-kiosque-de-soulier/" target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex', alignItems:'center', gap:'0.6rem'}}>
                <LinkedInIcon size={15} /> Beau Kiosque de Soulier
              </a>
            </div>
          </div>

          <div className="site-footer__cols">
            {columns.map(col => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map(link => (
                    <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3>{t.footer.shop}</h3>
              <ul style={{fontSize:'0.9375rem', lineHeight:1.7}}>
                <li>3 rue de la Chaux<br />22100 Dinan</li>
                <li>
                  {t.footer.hours.mon}<br />
                  {t.footer.hours.tueThur}<br />
                  {t.footer.hours.wedFriSat}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="site-footer__signature">Beau Kiosque de Soulier</p>

        <div className="site-footer__bottom">
          <p>© 2026 BKS — Beau Kiosque de Soulier · Dinan · {t.footer.rights}</p>
          <p style={{ opacity: 0.45, fontSize: '0.75rem' }}>Développé par Opportis</p>
        </div>
      </div>
    </footer>
  )
}
