import type { CartItem } from '../types/cart'
import { isKeycapConfiguration } from './cartIdentity'
import { preserveStoredValue } from './preserveStoredValue'

export const cartStorageKey = 'beanforge-cart'

export function saveCart(items: CartItem[]): boolean {
  try {
    preserveStoredValue(cartStorageKey, (raw) => {
      try {
        const parsed: unknown = JSON.parse(raw)
        return Array.isArray(parsed) && parsed.every((item) => item !== null && typeof item === 'object' &&
          typeof item.productSlug === 'string' && typeof item.name === 'string' && typeof item.colour === 'string' &&
          typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 &&
          Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
          (item.image === undefined || typeof item.image === 'string') &&
          (item.configuration === undefined ? item.productSlug !== 'custom-keycaps' :
            item.productSlug === 'custom-keycaps' && isKeycapConfiguration(item.configuration) && item.colour === item.configuration.boardColour))
      } catch {
        return false
      }
    })
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
