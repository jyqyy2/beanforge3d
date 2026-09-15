export function preserveStoredValue(key: string, isValid: (raw: string) => boolean): void {
  const raw = localStorage.getItem(key)
  if (raw === null || isValid(raw)) return
  const backupKey = `${key}-recovery`
  const existing = localStorage.getItem(backupKey)
  if (existing !== null && existing !== raw) throw new Error('A different recovery copy already exists')
  if (existing === null) localStorage.setItem(backupKey, raw)
}
