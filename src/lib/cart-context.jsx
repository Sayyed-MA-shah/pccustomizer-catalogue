'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

// Cart items: { id, title, sku, imageUrl, quantity }
// Prices are NEVER stored — resolved server-side at order submission.
// Storage is scoped per user: 'pcc_cart:<userId>'

function storageKey(userId) {
  return userId ? `pcc_cart:${userId}` : 'pcc_cart:guest'
}

export function CartProvider({ userId, children }) {
  const [items, setItems]       = useState([])
  const [hydrated, setHydrated] = useState(false)

  // Re-load cart whenever userId changes (covers login as different user)
  useEffect(() => {
    setHydrated(false)
    setItems([])
    const key = storageKey(userId)
    if (!key) { setHydrated(true); return }
    try {
      const raw = localStorage.getItem(key)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [userId])

  // Persist to the user-scoped key whenever items change
  useEffect(() => {
    const key = storageKey(userId)
    if (!hydrated || !key) return
    try {
      localStorage.setItem(key, JSON.stringify(items))
    } catch {}
  }, [items, hydrated, userId])

  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, {
        id:       product.id,
        title:    product.title,
        sku:      product.sku      ?? null,
        imageUrl: product.imageUrl ?? null,
        quantity,
      }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) {
      setItems(prev => prev.filter(i => i.id !== id))
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, hydrated }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
