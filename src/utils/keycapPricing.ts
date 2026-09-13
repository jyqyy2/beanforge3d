import type { KeycapConfiguration, KeycapPricing } from '../types/keycap'

export function calculateKeycapPrice(configuration: KeycapConfiguration, pricing: KeycapPricing) {
  const boardMinor = pricing.boardPricesMinor[configuration.characters.length]
  const prices = configuration.characters.map((character) =>
    /^[A-Z0-9]$/.test(character) ? pricing.characterPricesMinor[character] : undefined
  )
  const completed = prices.filter((price) => typeof price === 'number' && Number.isSafeInteger(price) && price >= 0).length
  const charactersMinor = prices.reduce((total: number, price) => total + (typeof price === 'number' && Number.isSafeInteger(price) && price >= 0 ? price : 0), 0)
  const validBoard = Number.isSafeInteger(boardMinor) && boardMinor >= 0
  return { boardMinor: validBoard ? boardMinor : null, charactersMinor, totalMinor: validBoard ? boardMinor + charactersMinor : null, completed, complete: validBoard && completed === configuration.characters.length }
}
