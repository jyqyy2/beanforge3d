import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { products as localProducts } from './products'
import type { Product } from './products'
import keycapImage from '../assets/hero.png'
import halloweenImage from '../assets/halloweenimg.png'
import { StorefrontContext } from './storefrontContext'
import type { CatalogueState } from './storefrontContext'

type CategoryRow = { id: string; name: string }
type ColourRow = { id: string; name: string }
type VariantRow = { product_id: string; colour_id: string; price_minor: number; currency: string; sort_order: number }
type ProductRow = { id: string; slug: string; name: string; description: string; category_id: string; featured_rank: number | null; price_display: 'fixed' | 'from' }

const studioImages: Record<string, string> = { 'custom-keycaps': keycapImage, 'halloween-clicker': halloweenImage }
const localStudio: Product[] = [
  { slug: 'custom-keycaps', name: 'Keycap Studio', category: 'Studio', price: 4.90, priceDisplay: 'from', featuredRank: 3, description: 'Create a 1–8 character clicker board with optional extra keycaps.', colours: ['Cream', 'Pink', 'Black'], image: keycapImage },
  { slug: 'halloween-clicker', name: 'Halloween Fidget Clicker', category: 'Studio', price: 7.90, priceDisplay: 'from', featuredRank: 4, description: 'Choose a 1x1, 2x1, 2x2 or 4x1 board and your Halloween keycaps.', colours: ['Cream', 'Pink', 'Black', 'Purple', 'White', 'Turquoise'], image: halloweenImage },
]
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

async function rows<T>(table: string, select: string): Promise<T[]> {
  const response = await fetch(url + '/rest/v1/' + table + '?select=' + select, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
  if (!response.ok) throw new Error('Catalogue unavailable')
  return response.json() as Promise<T[]>
}

async function loadStorefront(): Promise<Product[]> {
  if (!url && !key) return [...localProducts, ...localStudio]
  if (!url || !key) throw new Error('Incomplete catalogue configuration')
  const [categories, colours, products, variants] = await Promise.all([
    rows<CategoryRow>('categories', 'id,name'),
    rows<ColourRow>('colours', 'id,name'),
    rows<ProductRow>('products', 'id,slug,name,description,category_id,featured_rank,price_display'),
    rows<VariantRow>('product_variants', 'product_id,colour_id,price_minor,currency,sort_order'),
  ])
  const categoryNames = new Map(categories.map(row => [row.id, row.name]))
  const colourNames = new Map(colours.map(row => [row.id, row.name]))
  return products.flatMap(row => {
    const available = variants.filter(variant => variant.product_id === row.id && variant.currency === 'SGD' && colourNames.has(variant.colour_id))
      .sort((first, second) => first.sort_order - second.sort_order)
    const category = categoryNames.get(row.category_id)
    if (!category || !available.length) return []
    const presentation = localProducts.find(product => product.slug === row.slug)
    if (!presentation && !studioImages[row.slug]) return []
    return [{ ...presentation, slug: row.slug, name: row.name, description: row.description, category,
      price: Math.min(...available.map(variant => variant.price_minor)) / 100,
      priceDisplay: row.price_display, featuredRank: row.featured_rank,
      colours: available.map(variant => colourNames.get(variant.colour_id)!),
      image: presentation?.image ?? studioImages[row.slug] } as Product]
  }).sort((first, second) => (first.featuredRank ?? 999) - (second.featuredRank ?? 999))
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogueState>({ products: [], loading: true, error: null })
  useEffect(() => {
    let active = true
    loadStorefront().then(products => { if (active) setState({ products, loading: false, error: null }) })
      .catch(() => { if (active) setState({ products: [], loading: false, error: 'Products are temporarily unavailable. Please try again later.' }) })
    return () => { active = false }
  }, [])
  return <StorefrontContext.Provider value={state}>{children}</StorefrontContext.Provider>
}
