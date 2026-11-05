export type PurchaseLine = {
  productSlug: string
  quantity: number
  colour?: string
  standDesign?: string
  personalisation?: string
  configuration?: {
    schemaVersion: number
    boardColour: string
    characters: { character: string; colour: string; characterColour?: string }[]
    extraCharacters?: { character: string; colour: string; characterColour?: string }[]
  }
  halloweenConfiguration?: {
    version: number
    layout: string
    boardColour: string
    slots: string[]
    extras?: string[]
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
    extraCharacterMinor: number
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

const v1Slugs = new Set(['custom-carplate-keychain', 'custom-name-keychain', 'qr-nfc-stand', 'custom-keycaps', 'halloween-clicker'])
const standDesigns = new Set(['Bee', 'Chick'])
const defaultCharacterColours = ['Cream', 'Pink', 'Blue', 'Black']
const halloweenBoardPricesMinor: Record<string, number> = { '1x1': 790, '2x1': 990, '2x2': 1190, '4x1': 1190 }
const halloweenSlotCounts: Record<string, number> = { '1x1': 1, '2x1': 2, '2x2': 4, '4x1': 4 }
const halloweenColours = new Set(['Cream', 'Pink', 'Black', 'Purple', 'White', 'Turquoise'])
const halloweenKeycaps = new Set(['pumpkin', 'ghost', 'skull', 'spider', 'cat-side', 'cat-back'])

function safeAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function quoteStudio(line: PurchaseLine, catalogue: Catalogue): { name: string; unitAmountMinor: number } | null {
  const pricing = catalogue.studioPricing
  const configuration = line.configuration
  const product = catalogue.products.find(item => item.slug === line.productSlug)
  const variant = product?.variants.find(item => item.colour === line.colour && item.currency === 'SGD' && item.priceMinor === 490)
  if (!pricing || !configuration || configuration.schemaVersion !== 3 ||
    !variant ||
    line.colour !== configuration.boardColour || line.standDesign !== undefined || line.personalisation !== undefined || line.halloweenConfiguration !== undefined ||
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
  if (configuration.extraCharacters !== undefined) {
    if (!Array.isArray(configuration.extraCharacters) || configuration.extraCharacters.length > 20 ||
      !safeAmount(pricing.extraCharacterMinor)) return null
    for (const entry of configuration.extraCharacters) {
      if (!isRecord(entry) || typeof entry.character !== 'string' || !/^[A-Z0-9]$/.test(entry.character) ||
        !pricing.characterColours.includes(entry.colour as string) ||
        (entry.characterColour !== undefined && !pricing.characterColours.includes(entry.characterColour as string))) return null
      amount += pricing.extraCharacterMinor
    }
  }
  return Number.isSafeInteger(amount) ? { name: 'Custom Keycaps', unitAmountMinor: amount } : null
}

function quoteHalloween(line: PurchaseLine, catalogue: Catalogue): { name: string; unitAmountMinor: number } | null {
  const configuration = line.halloweenConfiguration
  const product = catalogue.products.find(item => item.slug === line.productSlug)
  const variant = product?.variants.find(item => item.colour === line.colour && item.currency === 'SGD' && item.priceMinor === 790)
  if (!configuration || configuration.version !== 1 || line.configuration !== undefined ||
    !variant ||
    line.personalisation !== undefined || line.standDesign !== undefined ||
    line.colour !== configuration.boardColour || !halloweenColours.has(configuration.boardColour) ||
    !Object.prototype.hasOwnProperty.call(halloweenSlotCounts, configuration.layout) ||
    !Array.isArray(configuration.slots) || configuration.slots.length !== halloweenSlotCounts[configuration.layout] ||
    !configuration.slots.every(slot => halloweenKeycaps.has(slot)) ||
    (configuration.extras !== undefined && (!Array.isArray(configuration.extras) ||
      configuration.extras.length > 20 || !configuration.extras.every(extra => halloweenKeycaps.has(extra))))) return null
  return { name: 'Halloween Fidget Clicker', unitAmountMinor: halloweenBoardPricesMinor[configuration.layout] + (configuration.extras?.length ?? 0) * 250 }
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
    } else if (line.productSlug === 'halloween-clicker') {
      priced = quoteHalloween(line, catalogue)
    } else {
      if (line.configuration !== undefined || line.halloweenConfiguration !== undefined ||
        (line.productSlug === 'qr-nfc-stand' ? !standDesigns.has(line.standDesign ?? '') : line.standDesign !== undefined)) return null
      if (line.productSlug === 'custom-carplate-keychain') {
        if (typeof line.personalisation !== 'string' || !/^[A-Z0-9 ]{1,16}$/.test(line.personalisation) ||
          line.personalisation !== line.personalisation.trim() || line.personalisation.includes('  ')) return null
      } else if (line.productSlug === 'custom-name-keychain') {
        if (typeof line.personalisation !== 'string' || !/^[A-Z]{1,10}$/.test(line.personalisation)) return null
      } else if (line.personalisation !== undefined) return null
      const product = catalogue.products.find(item => item.slug === line.productSlug)
      const variant = product?.variants.find(item => item.colour === line.colour)
      if (product && variant && variant.currency === 'SGD' && safeAmount(variant.priceMinor)) {
        priced = { name: product.name, unitAmountMinor: variant.priceMinor +
          (line.productSlug === 'custom-name-keychain' ? (line.personalisation!.length - 1) * 100 : 0) }
      }
    }
    if (!priced) return null
    const lineAmountMinor = priced.unitAmountMinor * line.quantity
    if (!Number.isSafeInteger(lineAmountMinor)) return null
    quoted.push({
      productSlug: line.productSlug, quantity: line.quantity, colour: line.colour,
      ...(line.standDesign ? { standDesign: line.standDesign } : {}),
      ...(line.personalisation ? { personalisation: line.personalisation } : {}),
      ...(line.configuration ? { configuration: line.configuration } : {}),
      ...(line.halloweenConfiguration ? { halloweenConfiguration: line.halloweenConfiguration } : {}),
      ...priced, lineAmountMinor,
    })
  }
  const merchandiseSubtotalMinor = quoted.reduce((total, line) => total + line.lineAmountMinor, 0)
  if (!Number.isSafeInteger(merchandiseSubtotalMinor) || merchandiseSubtotalMinor <= 0) return null
  if (intent.country === 'MY') {
    return { currency: 'SGD', lines: quoted, merchandiseSubtotalMinor,
      shipping: { status: 'requires_carrier_quote', country: 'MY' }, payableTotalMinor: null }
  }
  const amountMinor = merchandiseSubtotalMinor < 4000 ? 390 : 0
  return { currency: 'SGD', lines: quoted, merchandiseSubtotalMinor,
    shipping: { status: 'quoted', country: 'SG', amountMinor },
    payableTotalMinor: merchandiseSubtotalMinor + amountMinor }
}
