export function nameKeychainPriceMinor(length: number): number | null {
  return Number.isSafeInteger(length) && length >= 1 && length <= 10 ? 690 + (length - 1) * 100 : null
}
