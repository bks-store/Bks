import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProductPage from './pages/ProductPage'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { CartProvider } from './context/CartContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { AdminProvider } from './context/AdminContext'
import { ContentProvider } from './context/ContentContext'
import { ProductsProvider } from './context/ProductsContext'
import { UserAuthProvider } from './context/UserAuthContext'
import { ToastProvider } from './context/ToastContext'
import CookieBanner from './components/CookieBanner'
import CartDrawer from './components/CartDrawer'

// Pages secondaires — chargées en différé
const BrandsPage = lazy(() => import('./pages/BrandsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const OrderConfirmedPage = lazy(() => import('./pages/OrderConfirmedPage'))
const ConnexionPage = lazy(() => import('./pages/ConnexionPage'))
const InscriptionPage = lazy(() => import('./pages/InscriptionPage'))
const MonComptePage = lazy(() => import('./pages/MonComptePage'))
const CgvPage = lazy(() => import('./pages/CgvPage'))
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'))
const LivraisonPage = lazy(() => import('./pages/LivraisonPage'))
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'))

// Admin — toujours chargé en différé
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminProductEdit = lazy(() => import('./pages/admin/AdminProductEdit'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'))
const AdminRubriques = lazy(() => import('./pages/admin/AdminRubriques'))
const AdminRubriqueEdit = lazy(() => import('./pages/admin/AdminRubriqueEdit'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))

function NotFoundPage() {
  return (
    <div className="container">
      <div className="empty" style={{paddingBlock:'8rem', textAlign:'center'}}>
        <p className="eyebrow" style={{marginBottom:'1rem'}}>404</p>
        <h1 className="display h-lg" style={{marginBottom:'1.5rem'}}>Page introuvable</h1>
        <p className="lead" style={{marginBottom:'2.5rem', color:'var(--ink-soft)'}}>Cette page n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn btn--solid">Retour à l'accueil</Link>
      </div>
    </div>
  )
}

function StoreFront() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    // Une seule visite par navigateur par jour
    const today = new Date().toISOString().split('T')[0]
    const key = `pv:${today}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('page_views').insert({ path: pathname }).then(() => {})
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CookieBanner />
      <CartDrawer />
      <main className="flex-1">
        <div key={pathname} className="page-fade">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/marques" element={<BrandsPage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/catalogue/:category" element={<CataloguePage />} />
              <Route path="/rubrique/:slug" element={<CataloguePage />} />
              <Route path="/produit/:id" element={<ProductPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/panier" element={<CartPage />} />
              <Route path="/commande-confirmee" element={<OrderConfirmedPage />} />
              <Route path="/connexion" element={<ConnexionPage />} />
              <Route path="/inscription" element={<InscriptionPage />} />
              <Route path="/mon-compte" element={<MonComptePage />} />
              <Route path="/cgv" element={<CgvPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/livraison" element={<LivraisonPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function AdminArea() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Suspense fallback={null}>
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="produits" element={<AdminProducts />} />
            <Route path="produits/:id" element={<AdminProductEdit />} />
            <Route path="commandes" element={<AdminOrders />} />
            <Route path="commandes/:id" element={<AdminOrderDetail />} />
            <Route path="rubriques" element={<AdminRubriques />} />
            <Route path="rubriques/:id" element={<AdminRubriqueEdit />} />
            <Route path="photos" element={<AdminMedia />} />
            <Route path="rapports" element={<AdminReports />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AdminProvider>
      <ContentProvider>
        <ProductsProvider>
        <UserAuthProvider>
        <ToastProvider>
        <CurrencyProvider>
        <CartProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminArea />} />
              <Route path="/*" element={<StoreFront />} />
            </Routes>
          </Suspense>
        </CartProvider>
        </CurrencyProvider>
        </ToastProvider>
        </UserAuthProvider>
        </ProductsProvider>
      </ContentProvider>
    </AdminProvider>
  )
}
