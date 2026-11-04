import { Link } from 'react-router-dom'
import InstagramIcon from '../components/InstagramIcon'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead from '../components/SEOHead'

export default function ContactPage() {
  const { t } = useTranslation()
  return (
    <div className="container">
      <SEOHead
        path="/contact"
        titleFr="Contact — BKS Dinan"
        titleEn="Contact — BKS Dinan"
        descFr="Contactez la boutique BKS à Dinan — 3 rue de la Chaux, 22100. Instagram, horaires et informations pratiques."
        descEn="Contact BKS shop in Dinan — 3 rue de la Chaux, 22100 Dinan, France. Instagram, opening hours and practical information."
      />
      <header className="page-head">
        <nav className="crumbs" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link><span>/</span><span aria-current="page">{t.contact.title}</span>
        </nav>
        <h1 className="display h-xl">{t.contact.title}</h1>
      </header>

      <div className="split" style={{paddingBottom:'var(--section)'}}>
        <aside className="split__side--left">
          <dl className="store__list" style={{marginTop:0}}>
            <div className="store__row"><dt>{t.contact.boutique}</dt><dd>3 rue de la Chaux<br />22100 Dinan</dd></div>
            <div className="store__row"><dt>Instagram</dt><dd>
              <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                <InstagramIcon size={14} /> @b.k.s_dinan
              </a>
            </dd></div>
          </dl>
        </aside>

        <form className="split__main--right" style={{display:'grid', gap:'2rem'}} onSubmit={e => e.preventDefault()}>
          <h2 className="display h-sm">Envoyer un message</h2>
          <div style={{display:'grid', gap:'2rem', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 220px), 1fr))'}}>
            <div className="field"><label htmlFor="c-name">{t.contact.name}</label><input id="c-name" type="text" placeholder={t.contact.namePlaceholder} /></div>
            <div className="field"><label htmlFor="c-email">{t.contact.email}</label><input id="c-email" type="email" placeholder={t.contact.emailPlaceholder} /></div>
          </div>
          <div className="field"><label htmlFor="c-msg">{t.contact.message}</label><textarea id="c-msg" rows={5} placeholder={t.contact.msgPlaceholder} /></div>
          <p style={{fontSize:'0.8125rem', color:'var(--ink-soft)'}}>{t.contact.sendNote}</p>
          <div><button type="submit" className="btn btn--solid">{t.contact.send}</button></div>
        </form>
      </div>
    </div>
  )
}
