const failedReads = new Set<string>()

export function hasStorageReadFailed(key: string): boolean {
  return failedReads.has(key)
}

export function readStoredValue(key: string): string | null {
  if (failedReads.has(key)) throw new Error('Reload to retry the initial storage read')
  try {
    return localStorage.getItem(key)
  } catch (error) {
    failedReads.add(key)
    throw error
  }
}

export function preserveStoredValue(key: string, isValid: (raw: string) => boolean): void {
  if (failedReads.has(key)) throw new Error('Saving blocked after failed initial read')
  const raw = localStorage.getItem(key)
  if (raw === null || isValid(raw)) return
  const backupKey = `${key}-recovery`
  const existing = localStorage.getItem(backupKey)
  if (existing !== null && existing !== raw) throw new Error('A different recovery copy already exists')
  if (existing === null) localStorage.setItem(backupKey, raw)
}
