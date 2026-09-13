import { createContext } from 'react'
import type { CartItem } from '../types/cart'
import type { KeycapConfiguration } from '../types/keycap'

export type CartContextType = {
  cartItems: CartItem[]
  storageFailed: boolean
  addToCart: (item: CartItem) => void
  updateCartDesign: (identity: string, configuration: KeycapConfiguration) => boolean
  removeFromCart: (itemIndex: number) => void
  updateCartItemQuantity: (
    itemIndex: number,
    quantity: number
  ) => void
}

export const CartContext = createContext<
  CartContextType | undefined
>(undefined)
