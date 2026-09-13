import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import { CartContext } from './cartContextValue'
import { cartItemIdentity, isKeycapConfiguration } from '../utils/cartIdentity'
import { updateKeycapCart } from '../utils/updateKeycapCart'
import type { KeycapConfiguration } from '../types/keycap'

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
      (item.image === undefined || typeof item.image === 'string') &&
      (item.configuration === undefined
        ? item.productSlug !== 'custom-keycaps'
        : item.productSlug === 'custom-keycaps' && isKeycapConfiguration(item.configuration) && item.colour === item.configuration.boardColour)
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
        addToCart,
        updateCartDesign,
        removeFromCart,
        updateCartItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
