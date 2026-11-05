import type { KeycapConfiguration, KeycapPricing } from '../types/keycap'

export function calculateKeycapPrice(configuration: KeycapConfiguration, pricing: KeycapPricing) {
  const boardMinor = pricing.boardPricesMinor[configuration.characters.length]
  const prices = configuration.characters.map(({ character }) =>
    /^[A-Z0-9]$/.test(character) ? pricing.characterPricesMinor[character] : undefined
  )
  const completed = prices.filter((price) => typeof price === 'number' && Number.isSafeInteger(price) && price >= 0).length
  const charactersMinor = prices.reduce((total: number, price) => total + (typeof price === 'number' && Number.isSafeInteger(price) && price >= 0 ? price : 0), 0)
  const extraCharacters = configuration.extraCharacters ?? []
  const validExtras = extraCharacters.length <= 20 && extraCharacters.every(({ character }) => /^[A-Z0-9]$/.test(character))
  const extraCharactersMinor = validExtras && Number.isSafeInteger(pricing.extraCharacterMinor) && pricing.extraCharacterMinor >= 0
    ? extraCharacters.length * pricing.extraCharacterMinor : null
  const validBoard = configuration.characters.length >= 1 && configuration.characters.length <= 8 && Number.isSafeInteger(boardMinor) && boardMinor >= 0
  const total = boardMinor + charactersMinor + (extraCharactersMinor ?? 0)
  const validTotal = validBoard && extraCharactersMinor !== null && Number.isSafeInteger(charactersMinor) && Number.isSafeInteger(total)
  return { boardMinor: validBoard ? boardMinor : null, charactersMinor, extraCharactersMinor, totalMinor: validTotal ? total : null, completed, complete: validTotal && completed === configuration.characters.length }
}
