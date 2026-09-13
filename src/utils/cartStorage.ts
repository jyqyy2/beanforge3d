import type { CartItem } from '../types/cart'

export const cartStorageKey = 'beanforge-cart'

export function saveCart(items: CartItem[]): boolean {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
