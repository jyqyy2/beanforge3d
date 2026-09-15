import type { Product } from './products'

export type CatalogueRecord = {
  product: { slug: string; name: string; description: string; is_active: boolean; price_display: 'fixed' | 'from'; featured_rank: number | null }
  category: { name: string; is_active: boolean }
  variants: Array<{ colour: { name: string }; price_minor: number; is_active: boolean; sort_order: number }>
  images: Array<{ storage_path: string; variant_colour?: string; sort_order: number }>
}

export type CatalogueSnapshot = { products: Product[]; status: 'loaded' } | { status: 'loading' } | { status: 'failed'; error: string }

function validRecord(value: unknown): value is CatalogueRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as CatalogueRecord
  const text = (input: unknown) => typeof input === 'string' && input.trim().length > 0
  const rank = (input: unknown) => typeof input === 'number' && Number.isSafeInteger(input) && input >= 0
  return !!record.product && !!record.category && text(record.product.slug) && text(record.product.name) &&
    text(record.product.description) && typeof record.product.is_active === 'boolean' &&
    ['fixed', 'from'].includes(record.product.price_display) &&
    (record.product.featured_rank === null || rank(record.product.featured_rank)) &&
    text(record.category.name) && typeof record.category.is_active === 'boolean' &&
    Array.isArray(record.variants) && record.variants.every(variant => variant && variant.colour && text(variant.colour.name) &&
      rank(variant.price_minor) && rank(variant.sort_order) && typeof variant.is_active === 'boolean') &&
    Array.isArray(record.images) && record.images.every(image => image && text(image.storage_path) && rank(image.sort_order) &&
      (image.variant_colour === undefined || text(image.variant_colour)))
}

export function mapCatalogueRecords(records: unknown): CatalogueSnapshot {
  if (!Array.isArray(records) || !records.every(validRecord)) return { status: 'failed', error: 'Invalid catalogue records' }
  if (records.some(record => record.product.is_active && record.category.is_active &&
    new Set(record.variants.filter(variant => variant.is_active).map(variant => variant.price_minor)).size > 1)) {
    return { status: 'failed', error: 'Unequal active variant prices' }
  }
  const products = records.flatMap((record) => {
    const variants = record.variants.filter((variant) => variant.is_active).sort((a, b) => a.sort_order - b.sort_order)
    if (!record.product.is_active || !record.category.is_active || variants.length === 0 ||
      !variants.every((variant) => Number.isSafeInteger(variant.price_minor) && variant.price_minor >= 0) ||
      !variants.every((variant) => variant.price_minor === variants[0].price_minor)) return []
    const images = [...record.images].sort((a, b) => a.sort_order - b.sort_order)
    const base = images.find((image) => !image.variant_colour)
    const colourImages = Object.fromEntries(variants.flatMap(variant => {
      const image = images.find(entry => entry.variant_colour === variant.colour.name)
      return image ? [[variant.colour.name, image.storage_path]] : []
    }))
    return [{ slug: record.product.slug, name: record.product.name, category: record.category.name,
      price: variants[0].price_minor / 100, description: record.product.description,
      colours: variants.map((variant) => variant.colour.name), image: base?.storage_path,
      colourImages: Object.keys(colourImages).length ? colourImages : undefined,
      priceDisplay: record.product.price_display, featuredRank: record.product.featured_rank }] satisfies Product[]
  })
  products.sort((left, right) => (left.featuredRank ?? Infinity) - (right.featuredRank ?? Infinity) || left.slug.localeCompare(right.slug))
  return { products, status: 'loaded' }
}

export function findCatalogueProduct(snapshot: CatalogueSnapshot, slug: string) {
  if (snapshot.status !== 'loaded') return snapshot
  const product = snapshot.products.find(entry => entry.slug === slug)
  return product ? { status: 'available' as const, product } : { status: 'unavailable' as const }
}
