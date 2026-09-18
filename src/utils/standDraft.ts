import type { Product } from '../data/products'
import { isStandDesign } from '../types/stand'
import type { StandDesign } from '../types/stand'
import { preserveStoredValue, readStoredValue } from './preserveStoredValue'

export const standDraftKey = 'beanforge-stand-draft'
export type StandDraft = { design: StandDesign; colour: string; quantity: number }

function parseDraft(raw: string, product: Product): StandDraft | null {
  try {
    const value = JSON.parse(raw)
    return value && isStandDesign(value.design) && product.standDesigns?.some(option => option.name === value.design) &&
      product.colours.includes(value.colour) && Number.isSafeInteger(value.quantity) && value.quantity > 0
      ? { design: value.design, colour: value.colour, quantity: value.quantity } : null
  } catch { return null }
}

export function readStandDraft(product: Product): { draft: StandDraft | null; status: 'ready' | 'invalid' | 'read-failed' } {
  try {
    const raw = readStoredValue(standDraftKey)
    if (raw === null) return { draft: null, status: 'ready' }
    const draft = parseDraft(raw, product)
    return { draft, status: draft ? 'ready' : 'invalid' }
  } catch { return { draft: null, status: 'read-failed' } }
}

export function saveStandDraft(draft: StandDraft, product: Product): boolean {
  try {
    const raw = JSON.stringify(draft)
    if (!parseDraft(raw, product)) return false
    preserveStoredValue(standDraftKey, value => parseDraft(value, product) !== null)
    localStorage.setItem(standDraftKey, raw)
    return true
  } catch { return false }
}
