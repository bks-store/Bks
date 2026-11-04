import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, LogOut, ExternalLink, Menu, X, LayoutGrid, Images } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { useTranslation } from '../../i18n/useTranslation'
import { IMAGES } from '../../config/images'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAdmin()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0) }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: t.admin.nav.dashboard, end: true },
    { to: '/admin/produits', icon: <Package size={18} strokeWidth={1.5} />, label: t.admin.nav.products },
    { to: '/admin/commandes', icon: <ShoppingBag size={18} strokeWidth={1.5} />, label: t.admin.nav.orders },
    { to: '/admin/rubriques', icon: <LayoutGrid size={18} strokeWidth={1.5} />, label: t.admin.nav.rubriques },
    { to: '/admin/photos', icon: <Images size={18} strokeWidth={1.5} />, label: t.admin.nav.photos },
  ]

  const nav = (
    <>
      <div className="admin-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="admin-side__foot admin-nav" style={{padding:'0.875rem'}}>
        <Link to="/" target="_blank"><ExternalLink size={17} strokeWidth={1.5} />{t.admin.nav.site}</Link>
        <button onClick={handleSignOut}><LogOut size={17} strokeWidth={1.5} />{t.admin.nav.signOut}</button>
        {user && <p className="admin-side__user">{user.email}</p>}
      </div>
    </>
  )

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          <Link to="/admin"><img src={IMAGES.logo.onDark} alt="BKS" /></Link>
          <p>Administration</p>
        </div>
        {nav}
      </aside>

      <header className="admin-top">
        <div>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
          </button>
        </div>
        <Link to="/admin" style={{width:'auto'}}><img src={IMAGES.logo.onDark} alt="BKS" /></Link>
        <div style={{display:'flex', justifyContent:'flex-end'}}>
          <Link to="/" target="_blank" aria-label={t.admin.nav.site}><ExternalLink size={18} strokeWidth={1.5} /></Link>
        </div>
      </header>

      {menuOpen && (
        <div className="admin-drawer">
          <div className="admin-drawer__bg" onClick={() => setMenuOpen(false)} />
          <nav style={{display:'flex', flexDirection:'column'}}>{nav}</nav>
        </div>
      )}

      <main className="admin-main">
        <div>{children}</div>
      </main>
    </div>
  )
}
