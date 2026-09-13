/* Product = what BeanForge3D sells
CartItem = what the customer has chosen to buy.*/

export type CartItem = {
  productSlug: string
  name: string
  price: number
  colour: string
  quantity: number
  image?: string
}