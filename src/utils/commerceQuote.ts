import { getProductBySlug, getCustomKeycapPricing } from '../data/catalogue'
import { isKeycapConfiguration } from './cartIdentity'
import { calculateKeycapPrice } from './keycapPricing'
import type { KeycapConfiguration } from '../types/keycap'
import type { StandDesign } from '../types/stand'

export const v1CommerceConfig = {
  currency: 'SGD' as const,
  singapore: { country: 'SG' as const, freeShippingThresholdMinor: 2000, flatShippingMinor: 500 },
  malaysia: { country: 'MY' as const },
  allowedCountries: ['SG', 'MY'] as const,
  maxQuantity: 100,
}

export type V1CartLineRequest = {
  productSlug: string
  quantity: number
  colour?: string
  standDesign?: StandDesign
  configuration?: KeycapConfiguration
}

export type ShippingRequest = { country: 'SG' | 'MY' }
export type ShippingQuote =
  | { status: 'quoted'; country: 'SG'; amountMinor: number; reason: 'singapore-policy' }
  | { status: 'requires-carrier-quote'; country: 'MY' }
  | { status: 'rejected'; reason: 'unsupported-country' }

export type MerchandiseQuote = {
  productSlug: string
  quantity: number
  unitAmountMinor: number
  lineAmountMinor: number
  colour?: string
  standDesign?: StandDesign
  configuration?: KeycapConfiguration
}

export type CartQuote = { currency: 'SGD'; lines: MerchandiseQuote[]; merchandiseSubtotalMinor: number }

function validQuantity(quantity: unknown): quantity is number {
  return typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0 && quantity <= v1CommerceConfig.maxQuantity
}

function quoteLine(line: V1CartLineRequest): MerchandiseQuote | null {
  if (!validQuantity(line.quantity)) return null
  if (line.productSlug === 'custom-keycaps') {
    if (!line.configuration || line.colour !== line.configuration.boardColour || !isKeycapConfiguration(line.configuration)) return null
    const price = calculateKeycapPrice(line.configuration, getCustomKeycapPricing())
    if (!price.complete || price.totalMinor === null) return null
    return { productSlug: line.productSlug, quantity: line.quantity, unitAmountMinor: price.totalMinor, lineAmountMinor: price.totalMinor * line.quantity, colour: line.colour, configuration: structuredClone(line.configuration) }
  }
  const product = getProductBySlug(line.productSlug)
  if (!product || !['bean-keycap', 'qr-nfc-stand'].includes(product.slug)) return null
  if (!line.colour || !product.colours.includes(line.colour)) return null
  if (product.slug === 'qr-nfc-stand' && (!line.standDesign || !product.standDesigns?.some(option => option.name === line.standDesign))) return null
  if (product.slug === 'bean-keycap' && line.standDesign !== undefined) return null
  const unitAmountMinor = product.price * 100
  return { productSlug: product.slug, quantity: line.quantity, unitAmountMinor, lineAmountMinor: unitAmountMinor * line.quantity, colour: line.colour, ...(line.standDesign ? { standDesign: line.standDesign } : {}) }
}

export function quoteMerchandise(lines: unknown): CartQuote | null {
  if (!Array.isArray(lines) || lines.length === 0) return null
  const quotedLines = lines.map(line => line && typeof line === 'object' ? quoteLine(line as V1CartLineRequest) : null)
  if (quotedLines.some(line => line === null)) return null
  const safeLines = quotedLines as MerchandiseQuote[]
  const merchandiseSubtotalMinor = safeLines.reduce((total, line) => total + line.lineAmountMinor, 0)
  if (!Number.isSafeInteger(merchandiseSubtotalMinor)) return null
  return { currency: 'SGD', lines: safeLines, merchandiseSubtotalMinor }
}

export function quoteShipping(request: unknown, merchandiseSubtotalMinor: number): ShippingQuote {
  if (!request || typeof request !== 'object' || !Number.isSafeInteger(merchandiseSubtotalMinor) || merchandiseSubtotalMinor < 0) return { status: 'rejected', reason: 'unsupported-country' }
  const country = (request as { country?: unknown }).country
  if (country === 'SG') return { status: 'quoted', country, amountMinor: merchandiseSubtotalMinor < v1CommerceConfig.singapore.freeShippingThresholdMinor ? v1CommerceConfig.singapore.flatShippingMinor : 0, reason: 'singapore-policy' }
  if (country === 'MY') return { status: 'requires-carrier-quote', country }
  return { status: 'rejected', reason: 'unsupported-country' }
}
