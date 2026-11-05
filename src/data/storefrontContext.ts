import { createContext, useContext } from 'react'
import type { Product } from './products'

export type CatalogueState = { products: Product[]; loading: boolean; error: string | null }
export const StorefrontContext = createContext<CatalogueState>({ products: [], loading: true, error: null })
export function useStorefront() { return useContext(StorefrontContext) }
export function productPath(slug: string) {
  return slug === 'custom-keycaps' ? '/studio/keycaps' : slug === 'halloween-clicker' ? '/studio/halloween' : '/product/' + slug
}
