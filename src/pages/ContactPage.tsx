import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import { useTranslation } from '../i18n/useTranslation'
import SEOHead from '../components/SEOHead'
import { supabase, isConfigured } from '../lib/supabase'

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
            <div className="store__row"><dt>Instagram</dt><dd>
              <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:'0.5rem'}}>
                <InstagramIcon size={14} /> @b.k.s_dinan
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
