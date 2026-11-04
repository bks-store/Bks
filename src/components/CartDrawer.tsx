import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../i18n/useTranslation'
import { formatPrice } from '../lib/format'

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, total, count } = useCart()
  const { t } = useTranslation()

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isCartOpen])

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-drawer__backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="cart-drawer" role="dialog" aria-modal="true" aria-label={t.nav.cart}>
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            {t.nav.cart}
            {count > 0 && <span className="cart-drawer__count">{count}</span>}
          </h2>
          <button className="icon-btn" onClick={closeCart} aria-label="Fermer">
            <X size={20} strokeWidth={1.4} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <ShoppingBag size={40} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--ink-soft)' }}>{t.cart.empty}</p>
            <button className="btn btn--outline" style={{ marginTop: '1.5rem' }} onClick={closeCart}>
              Continuer les achats
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__items">
              {items.map(item => (
                <li key={`${item.productId}-${item.size}`} className="cart-drawer__item">
                  <div className="cart-drawer__item-info">
                    <p className="cart-drawer__item-brand">{item.brand}</p>
                    <p className="cart-drawer__item-name">{item.name}</p>
                    <p className="cart-drawer__item-size">Taille {item.size}</p>
                  </div>
                  <div className="cart-drawer__item-right">
                    <p className="cart-drawer__item-price">{formatPrice(item.price)}</p>
                    <div className="cart-drawer__qty">
                      <button
                        className="icon-btn icon-btn--xs"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                        aria-label="Diminuer"
                      >
                        <Minus size={12} strokeWidth={1.8} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="icon-btn icon-btn--xs"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                        aria-label="Augmenter"
                      >
                        <Plus size={12} strokeWidth={1.8} />
                      </button>
                      <button
                        className="icon-btn icon-btn--xs"
                        onClick={() => removeItem(item.productId, item.size)}
                        aria-label="Supprimer"
                        style={{ marginLeft: '0.25rem', color: 'var(--ink-soft)' }}
                      >
                        <Trash2 size={14} strokeWidth={1.4} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>{t.cart.total}</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <Link
                to="/panier"
                className="btn btn--solid"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                onClick={closeCart}
              >
                {t.cart.checkout} <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <button
                className="btn btn--ghost"
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.875rem' }}
                onClick={closeCart}
              >
                Continuer les achats
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
