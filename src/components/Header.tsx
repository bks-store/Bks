import { useState, useEffect, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, Search, Menu, X, ArrowRight, User } from 'lucide-react'
import InstagramIcon from './InstagramIcon'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../i18n/useTranslation'
import { useUserAuth } from '../context/UserAuthContext'

import { IMAGES } from '../config/images'
import { useContent } from '../context/ContentContext'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { count, openCart } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, locale, setLocale } = useTranslation()
  const { visibleRubriques } = useContent()
  const { user } = useUserAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks = [
    { to: '/', label: t.nav.home, end: true },
    ...visibleRubriques.filter(r => r.inMenu).map(r => ({ to: `/rubrique/${r.slug}`, label: r.name, end: false })),
    { to: '/a-propos', label: t.nav.boutique, end: false },
  ]

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/catalogue?q=${encodeURIComponent(q)}`)
  }

  const [bannerMain, ...bannerRest] = t.banner.split(' — ')
  const logo = (
    <img src={IMAGES.logo.onDark} alt="BKS — Beau Kiosque de Soulier" width={1294} height={885} />
  )

  return (
    <>
      <div className="announce">
        <p>
          {bannerMain}
          {bannerRest.length > 0 && <span className="announce__extra"> — {bannerRest.join(' — ')}</span>}
        </p>
      </div>

      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container site-header__inner">
          <div className="site-header__left">
            <button className="icon-btn burger" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Menu size={22} strokeWidth={1.4} />
            </button>
            <button
              className="lang-toggle lang-toggle--mobile"
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              <span className={locale === 'fr' ? 'is-active' : ''}>FR</span>
              <span className="lang-toggle__sep">|</span>
              <span className={locale === 'en' ? 'is-active' : ''}>EN</span>
            </button>
            <Link to="/" className="site-header__logo site-header__logo--desktop">
              {logo}
              <span className="site-header__wordmark">Beau Kiosque<br />de Soulier</span>
            </Link>
          </div>

          <Link to="/" className="site-header__logo site-header__logo--mobile">{logo}</Link>

          <nav className="site-header__nav" aria-label="Navigation principale">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <button
              className="lang-toggle lang-toggle--desktop"
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              <span className={locale === 'fr' ? 'is-active' : ''}>FR</span>
              <span className="lang-toggle__sep">|</span>
              <span className={locale === 'en' ? 'is-active' : ''}>EN</span>
            </button>
            <button className="icon-btn" onClick={() => setSearchOpen(o => !o)} aria-label="Recherche" aria-expanded={searchOpen}>
              {searchOpen ? <X size={20} strokeWidth={1.4} /> : <Search size={20} strokeWidth={1.4} />}
            </button>
            <Link
              to={user ? '/mon-compte' : '/connexion'}
              className="icon-btn"
              aria-label={user ? t.auth.myAccount : t.auth.signIn}
            >
              <User size={20} strokeWidth={1.4} />
              {user && <span className="icon-btn__dot" aria-hidden="true" />}
            </Link>
            <button className="icon-btn" onClick={openCart} aria-label={t.nav.cart}>
              <ShoppingBag size={20} strokeWidth={1.4} />
              {count > 0 && <span className="icon-btn__count">{count}</span>}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-panel">
            <form className="container" onSubmit={submitSearch} role="search">
              <Search size={20} strokeWidth={1.4} />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.nav.search}
                autoFocus
              />
              <button type="submit" className="icon-btn" aria-label="Rechercher">
                <ArrowRight size={20} strokeWidth={1.4} />
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="container mobile-menu__top">
            <div>
              <button className="icon-btn burger" onClick={() => setMenuOpen(false)} aria-label="Fermer">
                <X size={22} strokeWidth={1.4} />
              </button>
            </div>
            <Link to="/">{logo}</Link>
            <div />
          </div>
          <nav className="container mobile-menu__links">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}>
                {link.label}
                <ArrowRight size={20} strokeWidth={1.2} />
              </Link>
            ))}
          </nav>
          <div className="container mobile-menu__foot">
            <p>3 rue de la Chaux, 22100 Dinan</p>
            <a href="https://www.instagram.com/b.k.s_dinan/" target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex', alignItems:'center', gap:'0.5rem', marginTop:'0.5rem', color:'var(--ink)'}}>
              <InstagramIcon size={15} /> @b.k.s_dinan
            </a>
          </div>
        </div>
      )}
    </>
  )
}
