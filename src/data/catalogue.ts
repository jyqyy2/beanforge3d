import { products } from './products'
import type { Product } from './products'
import type { KeycapPricing } from '../types/keycap'

const customKeycapPricing: KeycapPricing = {
  currency: 'SGD',
  developmentOnly: false,
  boardPricesMinor: { 1: 490, 2: 690, 3: 890, 4: 1090, 5: 1290, 6: 1490, 7: 1690, 8: 1790 },
  characterPricesMinor: Object.fromEntries(Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (character) => [character, 0])),
  extraCharacterMinor: 200,
}

export function getCustomKeycapPricing(): KeycapPricing {
  return customKeycapPricing
}

export function getCharacterColours(): string[] {
  return ['Cream', 'Pink', 'Blue', 'Black']
}

export function getKeycapBoardColours(): string[] {
  return ['Cream', 'Pink', 'Black']
}

export function getProducts(): Product[] {
  return [...products]
}

export function getProductBySlug(slug: string | undefined): Product | undefined {
  return products.find((product) => product.slug === slug)
}
