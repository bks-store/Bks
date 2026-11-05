import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { useUserAuth } from '../context/UserAuthContext'
import SEOHead from '../components/SEOHead'

export default function InscriptionPage() {
  const { t } = useTranslation()
  const a = t.auth
  const { signUp, signInWithGoogle } = useUserAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError(a.passwordMismatch); return }
    if (form.password.length < 8) { setError(a.passwordTooShort); return }
    setLoading(true)
    const { error: err, needsConfirm: nc } = await signUp(form.email, form.password, form.firstName, form.lastName)
    setLoading(false)
    if (err) {
      setError(a.errorSignUp)
    } else if (nc) {
      setNeedsConfirm(true)
    } else {
      navigate('/mon-compte')
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error: err } = await signInWithGoogle()
    if (err) setError(a.errorGoogle)
  }

  if (needsConfirm) {
    return (
      <div className="container" style={{ maxWidth: 480, paddingBlock: 'var(--section)', textAlign: 'center' }}>
        <h1 className="display h-lg" style={{ marginBottom: '1rem' }}>✉️</h1>
        <p style={{ fontSize: '1.0625rem', lineHeight: 1.7 }}>{a.checkEmail}</p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--ink-soft)' }}>
          <Link to="/" style={{ color: 'var(--gold, #c9a84c)' }}>← Retour à l'accueil</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 480, paddingBlock: 'var(--section)' }}>
      <SEOHead
        path="/inscription"
        titleFr="Créer un compte"
        titleEn="Create account"
        noIndex
      />
      <h1 className="display h-lg" style={{ marginBottom: '2rem' }}>{a.createAccount}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="firstName">{a.firstName}</label>
            <input id="firstName" type="text" value={form.firstName} onChange={set('firstName')} required autoComplete="given-name" />
          </div>
          <div className="field">
            <label htmlFor="lastName">{a.lastName}</label>
            <input id="lastName" type="text" value={form.lastName} onChange={set('lastName')} required autoComplete="family-name" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">{a.email}</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">{a.password}</label>
          <input id="password" type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="confirm">{a.confirmPassword}</label>
          <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} required minLength={8} autoComplete="new-password" />
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--error, #e53935)', fontSize: '0.875rem' }}>{error}</p>
        )}

        <button type="submit" className="btn btn--solid" disabled={loading}>
          {loading ? '…' : a.createAccount}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: 'var(--ink-soft)' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--ink-faint, rgba(255,255,255,.12))' }} />
        <span style={{ fontSize: '0.8125rem' }}>{a.orContinueWith}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--ink-faint, rgba(255,255,255,.12))' }} />
      </div>

      <button
        type="button"
        className="btn btn--outline"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
        onClick={handleGoogle}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {a.continueWithGoogle}
      </button>

      <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
        {a.alreadyAccount}{' '}
        <Link to="/connexion" style={{ color: 'var(--gold, #c9a84c)' }}>{a.signIn}</Link>
      </p>
    </div>
  )
}
