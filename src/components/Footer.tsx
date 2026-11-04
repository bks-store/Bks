import { Link } from 'react-router-dom'
import InstagramIcon from './InstagramIcon'
import { useTranslation } from '../i18n/useTranslation'
import { IMAGES } from '../config/images'
import { useContent } from '../context/ContentContext'

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
            <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex', alignItems:'center', gap:'0.6rem'}}>
              <InstagramIcon size={15} /> @b.k.s_dinan
            </a>
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
          <p>{t.footer.authentic}</p>
        </div>
      </div>
    </footer>
  )
}
