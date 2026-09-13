import { products } from './products'
import type { Product } from './products'

export function getProducts(): Product[] {
  return [...products]
}

export function getProductBySlug(slug: string | undefined): Product | undefined {
  return products.find((product) => product.slug === slug)
}
