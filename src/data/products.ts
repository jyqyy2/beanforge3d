import carPlateRed from '../assets/carplate-red.png'
import carPlateWhite from '../assets/carplate-white.png'
import carPlateBlack from '../assets/carplate-black.png'
import carPlateYellow from '../assets/carplate-yellow.png'
import nameTag from '../assets/name-tag-1280.webp'
import qrStand from '../assets/qr-stand-1280.webp'
import chickPhoto from '../assets/qr-chick.png'
import beePhoto from '../assets/qr-bee.png'
import type { StandDesign } from '../types/stand'

/* mini product database (not real db, is notebook kinda only)*/
export type Product = {
  slug: string
  name: string
  category: string
  price: number
  priceDisplay?: 'fixed' | 'from'
  featuredRank?: number | null
  description: string
  colours: string[]
  image?: string
  standDesigns?: { name: StandDesign; image: string }[]
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
    slug: 'custom-carplate-keychain',
    name: 'Custom Car Plate Keychain',
    category: 'Custom',
    price: 4.90,
    image: carPlateRed,
    description:
      'Make a mini car plate your own. Enter your plate text and pick a colour. S$4.90 per piece.',
    colours: ['Red', 'White', 'Black', 'Yellow'],
    colourImages: { Red: carPlateRed, White: carPlateWhite, Black: carPlateBlack, Yellow: carPlateYellow },
  },

  {
    slug: 'custom-name-keychain',
    name: 'Custom Name Keychain',
    category: 'Custom',
    price: 6.90,
    priceDisplay: 'from',
    image: nameTag,
    description:
      'Your name. Your colour. Your way. Personalise a keychain with 1 to 10 letters. Pricing for longer names is coming soon.',
    colours: ['Cream', 'Pink', 'Blue', 'Black'],
  },

  {
    slug: 'qr-nfc-stand',
    name: 'QR / NFC Stand',
    category: 'QR / NFC',
    price: 15.90,
    image: qrStand,
    standDesigns: [
      { name: 'Chick', image: chickPhoto },
      { name: 'Bee', image: beePhoto },
    ],
    description:
      'A simple little stand for your business, perfect for QR payments, menus and NFC interactions.',
    colours: ['Black', 'White', 'Orange'],
  },
]
