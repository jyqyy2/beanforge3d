/* Product = what BeanForge3D sells
CartItem = what the customer has chosen to buy.*/

import type { KeycapConfiguration } from './keycap'

export type CartItem = {
  productSlug: string
  name: string
  price: number
  colour: string
  quantity: number
  image?: string
  configuration?: KeycapConfiguration
}
