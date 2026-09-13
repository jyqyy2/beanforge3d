import type { CartItem } from '../types/cart'
import type { KeycapConfiguration } from '../types/keycap'
import { getCharacterColours, getProductBySlug } from '../data/catalogue'

export function isKeycapConfiguration(value: unknown, allowIncomplete = false): value is KeycapConfiguration {
  if (!value || typeof value !== 'object') return false
  const config = value as Partial<KeycapConfiguration>
  return config.schemaVersion === 3 &&
    typeof config.boardColour === 'string' &&
    (getProductBySlug('bean-keycap')?.colours ?? []).includes(config.boardColour) &&
    Array.isArray(config.characters) && config.characters.length >= 1 && config.characters.length <= 8 &&
    config.characters.every((item) => item && typeof item === 'object' &&
      typeof item.character === 'string' &&
      (allowIncomplete && item.character === ''
        ? item.colour === '' || getCharacterColours().includes(item.colour)
        : /^[A-Z0-9]$/.test(item.character) && getCharacterColours().includes(item.colour)))
}

export function cartItemIdentity(item: CartItem): string {
  return JSON.stringify(item.configuration
    ? [item.productSlug, item.configuration.schemaVersion, item.configuration.boardColour,
      item.configuration.characters.map(({ character, colour }) => [character, colour])]
    : [item.productSlug, item.colour])
}
