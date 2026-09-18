import type { CartItem } from '../types/cart'
import { isStandDesign } from '../types/stand'
import { isKeycapConfiguration } from './cartIdentity'
import { preserveStoredValue, readStoredValue } from './preserveStoredValue'

export const cartStorageKey = 'beanforge-cart'

type CartLoadResult = {
  items: CartItem[]
  status: 'loaded' | 'invalid-data' | 'read-failed'
}

function isCartItem(item: unknown): item is CartItem {
  if (item === null || typeof item !== 'object') return false
  const candidate = item as Record<string, unknown>
  return typeof candidate.productSlug === 'string' &&
    typeof candidate.name === 'string' && typeof candidate.colour === 'string' &&
    typeof candidate.price === 'number' && Number.isFinite(candidate.price) && candidate.price >= 0 &&
    typeof candidate.quantity === 'number' && Number.isSafeInteger(candidate.quantity) && candidate.quantity > 0 &&
    (candidate.image === undefined || typeof candidate.image === 'string') &&
    (candidate.standDesign === undefined || (candidate.productSlug === 'qr-nfc-stand' && isStandDesign(candidate.standDesign))) &&
    (candidate.configuration === undefined ? candidate.productSlug !== 'custom-keycaps' :
      candidate.productSlug === 'custom-keycaps' && isKeycapConfiguration(candidate.configuration) && candidate.colour === candidate.configuration.boardColour)
}

export function loadCart(): CartLoadResult {
  let raw: string | null
  try {
    raw = readStoredValue(cartStorageKey)
  } catch {
    return { items: [], status: 'read-failed' }
  }
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(parsed)) return { items: [], status: 'invalid-data' }
    const items = parsed.filter(isCartItem)
    return { items, status: items.length === parsed.length ? 'loaded' : 'invalid-data' }
  } catch {
    return { items: [], status: 'invalid-data' }
  }
}

export function saveCart(items: CartItem[]): boolean {
  try {
    preserveStoredValue(cartStorageKey, (raw) => {
      try {
        const parsed: unknown = JSON.parse(raw)
        return Array.isArray(parsed) && parsed.every(isCartItem)
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
