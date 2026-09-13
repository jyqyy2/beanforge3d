import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartItem } from '../types/cart'
import { CartContext } from './cartContextValue'

const cartStorageKey = 'beanforge-cart'

function getSavedCartItems() {
  const savedCartItems = localStorage.getItem(cartStorageKey)

  if (!savedCartItems) {
    return []
  }

  try {
    return JSON.parse(savedCartItems) as CartItem[]
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
    localStorage.setItem(
      cartStorageKey,
      JSON.stringify(cartItems)
    )
  }, [cartItems])

  function addToCart(item: CartItem) {
    setCartItems((currentItems) => [
      ...currentItems,
      item,
    ])
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
