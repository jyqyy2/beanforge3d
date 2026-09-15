import type { KeycapConfiguration } from '../types/keycap'
import { isKeycapConfiguration } from './cartIdentity'
import { preserveStoredValue, readStoredValue } from './preserveStoredValue'

export const keycapDraftStorageKey = 'beanforge-keycap-draft'
let draftNeedsRecovery = false

export function needsDraftRecovery(): boolean {
  return draftNeedsRecovery
}

export function exportDraftRecovery(): string {
  const raw = localStorage.getItem(keycapDraftStorageKey)
  const preservedRaw = localStorage.getItem(`${keycapDraftStorageKey}-recovery`)
  if (raw === null && preservedRaw === null) throw new Error('No draft data available')
  return JSON.stringify({ format: 'beanforge-draft-recovery', version: 1, raw, preservedRaw }, null, 2)
}

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
    const raw = readStoredValue(keycapDraftStorageKey)
    const draft = parseKeycapDraft(raw)
    if (raw !== null && draft === null) draftNeedsRecovery = true
    return draft
  } catch {
    draftNeedsRecovery = true
    return null
  }
}

export function saveKeycapDraft(draft: KeycapDraft): boolean {
  if (draftNeedsRecovery) return false
  try {
    preserveStoredValue(keycapDraftStorageKey, (raw) => parseKeycapDraft(raw) !== null)
    localStorage.setItem(keycapDraftStorageKey, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}
