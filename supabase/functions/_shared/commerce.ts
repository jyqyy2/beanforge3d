export type PurchaseLine = {
  productSlug: string
  quantity: number
  colour?: string
  standDesign?: string
  configuration?: {
    schemaVersion: number
    boardColour: string
    characters: { character: string; colour: string; characterColour?: string }[]
  }
}

export type PricedVariant = {
  colour: string
  priceMinor: number
  currency: string
}

export type PricedProduct = {
  slug: string
  name: string
  variants: PricedVariant[]
}

export type Catalogue = {
  products: PricedProduct[]
  studioPricing?: {
    boardPricesMinor: Record<string, number>
    characterPricesMinor: Record<string, number>
    boardColours: string[]
    characterColours: string[]
  }
}

export type QuotedLine = PurchaseLine & {
  name: string
  unitAmountMinor: number
  lineAmountMinor: number
}

export type CommerceQuote = {
  currency: 'SGD'
  lines: QuotedLine[]
  merchandiseSubtotalMinor: number
  shipping: { status: 'quoted'; country: 'SG'; amountMinor: number } |
    { status: 'requires_carrier_quote'; country: 'MY' }
  payableTotalMinor: number | null
}

const v1Slugs = new Set(['bean-keycap', 'qr-nfc-stand', 'custom-keycaps'])
const standDesigns = new Set(['Bee', 'Chick'])
const defaultCharacterColours = ['Cream', 'Pink', 'Blue', 'Black']

function safeAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function quoteStudio(line: PurchaseLine, catalogue: Catalogue): { name: string; unitAmountMinor: number } | null {
  const pricing = catalogue.studioPricing
  const configuration = line.configuration
  if (!pricing || !configuration || configuration.schemaVersion !== 3 ||
    line.colour !== configuration.boardColour || line.standDesign !== undefined ||
    !pricing.boardColours.includes(configuration.boardColour) ||
    !Array.isArray(configuration.characters) || configuration.characters.length < 1 ||
    configuration.characters.length > 8) return null

  const boardPrice = pricing.boardPricesMinor[String(configuration.characters.length)]
  if (!safeAmount(boardPrice)) return null
  let amount = boardPrice
  for (const entry of configuration.characters) {
    if (!isRecord(entry) || typeof entry.character !== 'string' || !/^[A-Z0-9]$/.test(entry.character) ||
      !defaultCharacterColours.includes(entry.colour as string) ||
      !pricing.characterColours.includes(entry.colour as string) ||
      (entry.characterColour !== undefined && !pricing.characterColours.includes(entry.characterColour as string))) return null
    const characterPrice = pricing.characterPricesMinor[entry.character]
    if (!safeAmount(characterPrice)) return null
    amount += characterPrice
  }
  return Number.isSafeInteger(amount) ? { name: 'Custom Keycaps', unitAmountMinor: amount } : null
}

export function quoteCommerce(intent: unknown, catalogue: Catalogue): CommerceQuote | null {
  if (!isRecord(intent) || !Array.isArray(intent.lines) || intent.lines.length === 0 || intent.lines.length > 30 ||
    (intent.country !== 'SG' && intent.country !== 'MY')) return null
  const quoted: QuotedLine[] = []
  for (const raw of intent.lines) {
    if (!isRecord(raw) || typeof raw.productSlug !== 'string' || !v1Slugs.has(raw.productSlug) ||
      !Number.isSafeInteger(raw.quantity) || (raw.quantity as number) < 1 || (raw.quantity as number) > 100 ||
      typeof raw.colour !== 'string') return null
    const line = raw as PurchaseLine
    let priced: { name: string; unitAmountMinor: number } | null = null
    if (line.productSlug === 'custom-keycaps') {
      priced = quoteStudio(line, catalogue)
    } else {
      if (line.configuration !== undefined ||
        (line.productSlug === 'qr-nfc-stand' ? !standDesigns.has(line.standDesign ?? '') : line.standDesign !== undefined)) return null
      const product = catalogue.products.find(item => item.slug === line.productSlug)
      const variant = product?.variants.find(item => item.colour === line.colour)
      if (product && variant && variant.currency === 'SGD' && safeAmount(variant.priceMinor)) {
        priced = { name: product.name, unitAmountMinor: variant.priceMinor }
      }
    }
    if (!priced) return null
    const lineAmountMinor = priced.unitAmountMinor * line.quantity
    if (!Number.isSafeInteger(lineAmountMinor)) return null
    quoted.push({
      productSlug: line.productSlug, quantity: line.quantity, colour: line.colour,
      ...(line.standDesign ? { standDesign: line.standDesign } : {}),
      ...(line.configuration ? { configuration: line.configuration } : {}),
      ...priced, lineAmountMinor,
    })
  }
  const merchandiseSubtotalMinor = quoted.reduce((total, line) => total + line.lineAmountMinor, 0)
  if (!Number.isSafeInteger(merchandiseSubtotalMinor) || merchandiseSubtotalMinor <= 0) return null
  if (intent.country === 'MY') {
    return { currency: 'SGD', lines: quoted, merchandiseSubtotalMinor,
      shipping: { status: 'requires_carrier_quote', country: 'MY' }, payableTotalMinor: null }
  }
  const amountMinor = merchandiseSubtotalMinor < 2000 ? 500 : 0
  return { currency: 'SGD', lines: quoted, merchandiseSubtotalMinor,
    shipping: { status: 'quoted', country: 'SG', amountMinor },
    payableTotalMinor: merchandiseSubtotalMinor + amountMinor }
}
