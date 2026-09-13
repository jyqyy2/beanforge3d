import { products } from './products'
import type { Product } from './products'
import type { KeycapPricing } from '../types/keycap'

const customKeycapPricing: KeycapPricing = {
  currency: 'SGD',
  developmentOnly: true,
  boardPricesMinor: { 1: 1000, 2: 1800, 3: 2600, 4: 3400, 5: 4200, 6: 5000, 7: 5800, 8: 6600 },
  characterPricesMinor: Object.fromEntries(Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (character) => [character, 300])),
}

export function getCustomKeycapPricing(): KeycapPricing {
  return customKeycapPricing
}

export function getProducts(): Product[] {
  return [...products]
}

export function getProductBySlug(slug: string | undefined): Product | undefined {
  return products.find((product) => product.slug === slug)
}
