/* Product = what BeanForge3D sells
CartItem = what the customer has chosen to buy.*/

import type { KeycapConfiguration } from './keycap'
import type { StandDesign } from './stand'

export type CartItem = {
  productSlug: string
  name: string
  price: number
  colour: string
  quantity: number
  image?: string
  standDesign?: StandDesign
  configuration?: KeycapConfiguration
}
