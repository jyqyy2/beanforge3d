import { createContext } from 'react'
import type { CartItem } from '../types/cart'

export type CartContextType = {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemIndex: number) => void
}

export const CartContext = createContext<
  CartContextType | undefined
>(undefined)
