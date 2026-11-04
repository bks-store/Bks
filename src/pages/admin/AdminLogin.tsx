import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { useTranslation } from '../../i18n/useTranslation'
import { isConfigured } from '../../lib/supabase'
import { IMAGES } from '../../config/images'

export default function AdminLogin() {
  const { signIn, user } = useAdmin()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/admin') }, [user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) setError(t.admin.login.error)
    else navigate('/admin')
  }

  return (
    <div className="admin login">
      <div className="login__visual theme-dark">
        <img src={IMAGES.hero} alt="" className="login__photo" />
        <div className="login__brand">
          <img src={IMAGES.logo.onDark} alt="BKS" />
          <p>Beau Kiosque de Soulier — Dinan</p>
        </div>
      </div>

      <div className="login__panel">
        <form onSubmit={handleSubmit} className="login__form">
          <img src={IMAGES.logo.mark} alt="BKS" className="login__mark" />
          <p className="eyebrow">Administration</p>
          <h1>{t.admin.login.title}</h1>
          <p className="login__sub">{t.admin.login.subtitle}</p>

          <div className="field">
            <label htmlFor="a-email">{t.admin.login.email}</label>
            <input id="a-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="a-pass">{t.admin.login.password}</label>
            <input id="a-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>

          {error && <p className="login__error" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn--solid btn--block" style={{opacity: loading ? 0.6 : 1}}>
            {loading ? '…' : <>{t.admin.login.signIn} <ArrowRight size={16} strokeWidth={1.5} /></>}
          </button>

          {!isConfigured && (
            <p className="login__note">
              {import.meta.env.DEV
                ? 'Aperçu local : Supabase n\'est pas configuré, n\'importe quel identifiant ouvre le mode démo.'
                : 'Connexion indisponible : Supabase n\'est pas encore configuré.'}
            </p>
          )}
          <Link to="/" className="admin-link" style={{alignSelf:'flex-start', marginTop:'0.5rem'}}>Retour au site</Link>
        </form>
      </div>
    </div>
  )
}
