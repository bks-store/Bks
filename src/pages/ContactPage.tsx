import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead from '../components/SEOHead'
import { supabase, isConfigured } from '../lib/supabase'

const FacebookIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const LinkedInIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

export default function ContactPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')
    setErrorMsg('')
    try {
      if (isConfigured) {
        const { error } = await supabase.functions.invoke('send-contact-email', {
          body: { name: name.trim(), email: email.trim(), message: message.trim() },
        })
        if (error) throw new Error(error.message)
      }
      setStatus('done')
    } catch (e) {
      setErrorMsg((e as Error).message)
      setStatus('error')
    }
  }

  return (
    <div className="container">
      <SEOHead
        path="/contact"
        titleFr="Contact"
        titleEn="Contact"
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
            <div className="store__row"><dt>Réseaux sociaux</dt><dd style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                <InstagramIcon size={14} /> @b.k.s_dinan
              </a>
              <a href="https://www.facebook.com/p/BKS-Beau-Kiosque-de-Soulier-61593872704384/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                <FacebookIcon size={14} /> BKS — Beau Kiosque de Soulier
              </a>
              <a href="https://www.linkedin.com/company/beau-kiosque-de-soulier/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                <LinkedInIcon size={14} /> Beau Kiosque de Soulier
              </a>
            </dd></div>
          </dl>
        </aside>

        {status === 'done' ? (
          <div className="split__main--right" style={{display:'flex', flexDirection:'column', gap:'1rem', paddingTop:'1rem'}}>
            <CheckCircle2 size={36} color="#4E7A43" strokeWidth={1.5} />
            <h2 className="display h-sm">Message envoyé !</h2>
            <p className="lead" style={{color:'var(--ink-soft)'}}>Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.</p>
            <button className="btn btn--outline" style={{alignSelf:'flex-start', marginTop:'0.5rem'}} onClick={() => { setStatus('idle'); setName(''); setEmail(''); setMessage('') }}>
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form className="split__main--right" style={{display:'grid', gap:'2rem'}} onSubmit={handleSubmit}>
            <h2 className="display h-sm">Envoyer un message</h2>
            <div style={{display:'grid', gap:'2rem', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 220px), 1fr))'}}>
              <div className="field">
                <label htmlFor="c-name">{t.contact.name}</label>
                <input id="c-name" type="text" placeholder={t.contact.namePlaceholder} value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="c-email">{t.contact.email}</label>
                <input id="c-email" type="email" placeholder={t.contact.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-msg">{t.contact.message}</label>
              <textarea id="c-msg" rows={5} placeholder={t.contact.msgPlaceholder} value={message} onChange={e => setMessage(e.target.value)} required />
            </div>
            {status === 'error' && (
              <p style={{fontSize:'0.875rem', color:'#C0392B', margin:0}}>{errorMsg || 'Une erreur est survenue. Veuillez réessayer.'}</p>
            )}
            <p style={{fontSize:'0.8125rem', color:'var(--ink-soft)'}}>{t.contact.sendNote}</p>
            <div>
              <button type="submit" className="btn btn--solid" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi…' : t.contact.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
