import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import { CartContext } from './cartContextValue'
import { cartItemIdentity, isKeycapConfiguration } from '../utils/cartIdentity'
import { updateKeycapCart } from '../utils/updateKeycapCart'
import type { KeycapConfiguration } from '../types/keycap'

import { loadCart, saveCart } from '../utils/cartStorage'

export function CartProvider({
  children,
}: {
  children: ReactNode
}) { /* following 1 line is the cart memory | Building React memory → shared across the website*/
  const [initialCart] = useState(loadCart)
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart.items)

  const [storageFailed, setStorageFailed] = useState(false)
  useEffect(() => {
    const failed = !saveCart(cartItems)
    const timer = window.setTimeout(() => setStorageFailed(failed), 0)
    return () => window.clearTimeout(timer)
  }, [cartItems])

  function addToCart(item: CartItem) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return
    if (item.productSlug === 'custom-keycaps' && (!isKeycapConfiguration(item.configuration) || item.colour !== item.configuration.boardColour)) return
    if (item.configuration && item.productSlug !== 'custom-keycaps') return
    const identity = cartItemIdentity(item)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) =>
          cartItemIdentity(currentItem) === identity
      )

      if (!existingItem) {
        return [
          ...currentItems,
          item,
        ]
      }

      if (!Number.isSafeInteger(existingItem.quantity + item.quantity)) {
        return currentItems
      }

      return currentItems.map((currentItem) =>
        cartItemIdentity(currentItem) === identity
          ? {
              ...currentItem,
              quantity: currentItem.quantity + item.quantity,
            }
          : currentItem
      )
    })
  }

  function removeFromCart(itemIndex: number) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (_item, index) => index !== itemIndex
      )
    )
  }

  function updateCartDesign(identity: string, configuration: KeycapConfiguration) {
    const updated = updateKeycapCart(cartItems, identity, configuration)
    if (!updated) return false
    setCartItems(updated)
    return true
  }

  function updateCartItemQuantity(
    itemIndex: number,
    quantity: number
  ) {
    if (!Number.isSafeInteger(quantity)) return
    setCartItems((currentItems) =>
      currentItems.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              quantity: Math.max(1, quantity),
            }
          : item
      )
    )
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        storageFailed,
        addToCart,
        updateCartDesign,
        removeFromCart,
        updateCartItemQuantity,
      }}
    >
      {initialCart.status === 'read-failed' ? <main className="keycap-studio">
        <h1>Your saved cart could not be loaded.</h1>
        <p role="alert">We have not changed your saved cart. Reload to try again before continuing.</p>
        <button type="button" className="studio-add" onClick={() => window.location.reload()}>Reload and retry</button>
      </main> : children}
    </CartContext.Provider>
  )
}
