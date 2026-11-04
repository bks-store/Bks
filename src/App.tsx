import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProductPage from './pages/ProductPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import CartPage from './pages/CartPage'
import OrderConfirmedPage from './pages/OrderConfirmedPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductEdit from './pages/admin/AdminProductEdit'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminRubriques from './pages/admin/AdminRubriques'
import AdminRubriqueEdit from './pages/admin/AdminRubriqueEdit'
import AdminMedia from './pages/admin/AdminMedia'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { CartProvider } from './context/CartContext'
import { AdminProvider } from './context/AdminContext'
import { ContentProvider } from './context/ContentContext'
import { ProductsProvider } from './context/ProductsContext'
import { UserAuthProvider } from './context/UserAuthContext'
import { ToastProvider } from './context/ToastContext'
import ConnexionPage from './pages/ConnexionPage'
import InscriptionPage from './pages/InscriptionPage'
import MonComptePage from './pages/MonComptePage'
import CgvPage from './pages/CgvPage'
import ConfidentialitePage from './pages/ConfidentialitePage'
import CookieBanner from './components/CookieBanner'
import CartDrawer from './components/CartDrawer'

function StoreFront() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CookieBanner />
      <CartDrawer />
      <main className="flex-1">
        <div key={pathname} className="page-fade">
          <Routes>
            <Route path="/" element={<HomePage />} />
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
          </Routes>
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
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="produits/:id" element={<AdminProductEdit />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="commandes/:id" element={<AdminOrderDetail />} />
          <Route path="rubriques" element={<AdminRubriques />} />
          <Route path="rubriques/:id" element={<AdminRubriqueEdit />} />
          <Route path="photos" element={<AdminMedia />} />
        </Routes>
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
        <CartProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminArea />} />
            <Route path="/*" element={<StoreFront />} />
          </Routes>
        </CartProvider>
        </ToastProvider>
        </UserAuthProvider>
        </ProductsProvider>
      </ContentProvider>
    </AdminProvider>
  )
}
