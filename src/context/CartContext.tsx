import { createContext, useContext, useState, type ReactNode } from 'react'

export interface CartItem {
  productId: string
  name: string
  brand: string
  price: number
  size: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, qty: number) => void
  total: number
  count: number
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size)
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removeItem = (productId: string, size: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)))
  }

  const updateQuantity = (productId: string, size: string, qty: number) => {
    if (qty <= 0) { removeItem(productId, size); return }
    setItems(prev => prev.map(i =>
      i.productId === productId && i.size === size ? { ...i, quantity: qty } : i
    ))
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  const clearCart = () => setItems([])
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, total, count, clearCart, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
