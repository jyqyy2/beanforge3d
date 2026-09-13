import beanKeycap from '../assets/bean-keycap-1280.webp'
import nameTag from '../assets/name-tag-1280.webp'
import qrStand from '../assets/qr-stand-1280.webp'

/* mini product database (not real db, is notebook kinda only)*/
export type Product = {
  slug: string
  name: string
  category: string
  price: number
  description: string
  colours: string[]
  image?: string
  /* colour: string]: string means
  a product can optionally have a collection of images
  where each colour has its own image
  The ? is important. It means optional. So our existing products won't break just because they don't have colour-specific images yet*/
  colourImages?: {
    [colour: string]: string
  }
}

export const products: Product[] = [
  {
    slug: 'bean-keycap',
    name: 'Bean Keycap',
    category: 'Keycaps',
    price: 18,
    /* the product type already has image?: string in 'export type Product',
    So now we just need to tell each product which 
    picture belongs to it. With image: beanKeycap*/
    image: beanKeycap,
    description:
      'A little bean for keyboards that need a little personality.',
    colours: ['Cream', 'Pink', 'Black'],
  },

  {
    slug: 'custom-name-keychain',
    name: 'Custom Name Keychain',
    category: 'Custom',
    price: 9,
    image: nameTag,
    description:
      'Your name. Your colour. Your way. A small personalised keychain made to order.',
    colours: ['Cream', 'Pink', 'Blue', 'Black'],
  },

  {
    slug: 'qr-nfc-stand',
    name: 'QR / NFC Stand',
    category: 'QR / NFC',
    price: 15,
    image: qrStand,
    description:
      'A simple little stand for your business, perfect for QR payments, menus and NFC interactions.',
    colours: ['Black', 'White', 'Orange'],
  },
]
