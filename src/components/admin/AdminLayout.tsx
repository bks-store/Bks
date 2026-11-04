import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, LogOut, ExternalLink, Menu, X, LayoutGrid, Images, Store, BarChart2 } from 'lucide-react'
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
    { to: '/admin', icon: <LayoutDashboard size={17} strokeWidth={1.6} />, label: t.admin.nav.dashboard, end: true },
    { to: '/admin/produits', icon: <Package size={17} strokeWidth={1.6} />, label: t.admin.nav.products },
    { to: '/admin/commandes', icon: <ShoppingBag size={17} strokeWidth={1.6} />, label: t.admin.nav.orders },
    { to: '/admin/rubriques', icon: <LayoutGrid size={17} strokeWidth={1.6} />, label: t.admin.nav.rubriques },
    { to: '/admin/photos', icon: <Images size={17} strokeWidth={1.6} />, label: t.admin.nav.photos },
    { to: '/admin/rapports', icon: <BarChart2 size={17} strokeWidth={1.6} />, label: 'Rapports' },
  ]

  const navContent = (
    <>
      <div className="admin-nav">
        <p className="admin-nav__section">Navigation</p>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="admin-side__foot">
        <Link to="/" target="_blank">
          <Store size={16} strokeWidth={1.6} />
          {t.admin.nav.site}
        </Link>
        <button onClick={handleSignOut}>
          <LogOut size={16} strokeWidth={1.6} />
          {t.admin.nav.signOut}
        </button>
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
        {navContent}
      </aside>

      <header className="admin-top">
        <div>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
        <Link to="/admin" style={{width:'auto'}}><img src={IMAGES.logo.onDark} alt="BKS" /></Link>
        <div style={{display:'flex', justifyContent:'flex-end'}}>
          <Link to="/" target="_blank" aria-label={t.admin.nav.site}>
            <ExternalLink size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      {menuOpen && (
        <div className="admin-drawer">
          <div className="admin-drawer__bg" onClick={() => setMenuOpen(false)} />
          <nav>{navContent}</nav>
        </div>
      )}

      <main className="admin-main">
        <div>{children}</div>
      </main>
    </div>
  )
}
