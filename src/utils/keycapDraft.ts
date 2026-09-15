import type { KeycapConfiguration } from '../types/keycap'
import { isKeycapConfiguration } from './cartIdentity'
import { preserveStoredValue } from './preserveStoredValue'

export const keycapDraftStorageKey = 'beanforge-keycap-draft'

export type KeycapDraft = {
  version: 1
  count: number
  configuration: KeycapConfiguration
}

export function parseKeycapDraft(raw: string | null): KeycapDraft | null {
  try {
    const draft = JSON.parse(raw ?? 'null') as Partial<KeycapDraft> | null
    if (!draft || draft.version !== 1 || typeof draft.count !== 'number' || !Number.isInteger(draft.count) ||
      draft.count < 1 || draft.count > 8 ||
      !isKeycapConfiguration(draft.configuration, true) || draft.configuration.characters.length !== 8) return null
    return draft as KeycapDraft
  } catch {
    return null
  }
}

export function readKeycapDraft(): KeycapDraft | null {
  try {
    return parseKeycapDraft(localStorage.getItem(keycapDraftStorageKey))
  } catch {
    return null
  }
}

export function saveKeycapDraft(draft: KeycapDraft): boolean {
  try {
    preserveStoredValue(keycapDraftStorageKey, (raw) => parseKeycapDraft(raw) !== null)
    localStorage.setItem(keycapDraftStorageKey, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}
