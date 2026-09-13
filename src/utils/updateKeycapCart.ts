import type { CartItem } from '../types/cart'
import type { KeycapConfiguration } from '../types/keycap'
import { getCustomKeycapPricing } from '../data/catalogue'
import { calculateKeycapPrice } from './keycapPricing'
import { cartItemIdentity, isKeycapConfiguration } from './cartIdentity'

export function updateKeycapCart(items: CartItem[], identity: string, configuration: KeycapConfiguration): CartItem[] | null {
  const original = items.find((item) => cartItemIdentity(item) === identity && item.configuration)
  if (!original || !isKeycapConfiguration(configuration)) return null
  const quote = calculateKeycapPrice(configuration, getCustomKeycapPricing())
  if (!quote.complete || quote.totalMinor === null) return null
  const updated: CartItem = {
    ...original,
    name: `Custom keycaps · ${configuration.characters.map(({ character }) => character).join('')}`,
    price: quote.totalMinor / 100,
    colour: configuration.boardColour,
    configuration: { ...configuration, characters: configuration.characters.map((item) => ({ ...item })) },
  }
  const duplicate = items.find((item) => item !== original && cartItemIdentity(item) === cartItemIdentity(updated))
  if (duplicate && !Number.isSafeInteger(duplicate.quantity + original.quantity)) return null
  return items.flatMap((item) => {
    if (item === original) return duplicate ? [] : [updated]
    if (item === duplicate) return [{ ...updated, quantity: duplicate.quantity + original.quantity }]
    return [item]
  })
}
