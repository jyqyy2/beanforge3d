import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import { CartContext } from './cartContextValue'

const cartStorageKey = 'beanforge-cart'

function getSavedCartItems() {
  try {
    const savedCartItems = localStorage.getItem(cartStorageKey)
    const parsedItems: unknown = JSON.parse(savedCartItems ?? '[]')
    if (!Array.isArray(parsedItems)) return []

    return parsedItems.filter((item): item is CartItem =>
      item !== null && typeof item === 'object' &&
      typeof item.productSlug === 'string' &&
      typeof item.name === 'string' &&
      typeof item.colour === 'string' &&
      typeof item.price === 'number' &&
      Number.isFinite(item.price) && item.price >= 0 &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
      (item.image === undefined || typeof item.image === 'string')
    )
  } catch {
    return []
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode
}) { /* following 1 line is the cart memory | Building React memory → shared across the website*/
  const [cartItems, setCartItems] = useState<CartItem[]>(
    getSavedCartItems
  )

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems))
    } catch {
      return
    }
  }, [cartItems])

  function addToCart(item: CartItem) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) =>
          currentItem.productSlug === item.productSlug &&
          currentItem.colour === item.colour
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
        currentItem.productSlug === item.productSlug &&
        currentItem.colour === item.colour
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
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
