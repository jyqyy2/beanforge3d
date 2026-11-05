import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let quoteCommerce
try { ({ quoteCommerce } = await server.ssrLoadModule('/supabase/functions/_shared/commerce.ts')) } finally { await server.close() }

const catalogue = {
  products: [
    { slug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain', variants: [{ colour: 'Red', priceMinor: 490, currency: 'SGD' }] },
    { slug: 'custom-name-keychain', name: 'Custom Name Keychain', variants: [{ colour: 'Cream', priceMinor: 690, currency: 'SGD' }] },
    { slug: 'qr-nfc-stand', name: 'QR / NFC Stand', variants: [{ colour: 'Black', priceMinor: 1590, currency: 'SGD' }] },
    { slug: 'custom-keycaps', name: 'Keycap Studio', variants: [{ colour: 'Cream', priceMinor: 490, currency: 'SGD' }] },
    { slug: 'halloween-clicker', name: 'Halloween Fidget Clicker', variants: [{ colour: 'Cream', priceMinor: 790, currency: 'SGD' }] },
  ],
  studioPricing: {
    boardPricesMinor: { 1: 1000, 2: 1800 },
    characterPricesMinor: { A: 300, B: 300 },
    boardColours: ['Cream'],
    characterColours: ['Cream', 'Pink', 'Blue', 'Black'],
  },
}
const plate = (overrides = {}) => ({ productSlug: 'custom-carplate-keychain', colour: 'Red', personalisation: 'SMX 6769 L', quantity: 1, ...overrides })
const intent = (lines, country = 'SG') => ({ lines, country })

test('server prices merchandise and shipping without accepting browser amounts', () => {
  const result = quoteCommerce({
    ...intent([plate({ price: 1, name: 'Fake', subtotal: 0 }), plate({ quantity: 1 })]),
    shipping: 0, total: 0, price: 0,
  }, catalogue)
  assert.equal(result.merchandiseSubtotalMinor, 980)
  assert.deepEqual(result.lines.map(line => line.unitAmountMinor), [490, 490])
  assert.equal(result.shipping.amountMinor, 390)
  assert.equal(result.payableTotalMinor, 1370)
})

test('personalisation is required, carried into the quote and cannot invent longer-name prices', () => {
  const plateLine = { productSlug: 'custom-carplate-keychain', colour: 'Red', quantity: 2, personalisation: 'SMX 6769 L' }
  const name = { productSlug: 'custom-name-keychain', colour: 'Cream', quantity: 1, personalisation: 'J' }
  const result = quoteCommerce(intent([plateLine, name]), catalogue)
  assert.equal(result.merchandiseSubtotalMinor, 1670)
  assert.deepEqual(result.lines.map(line => line.personalisation), ['SMX 6769 L', 'J'])
  for (const invalid of [
    { ...plateLine, personalisation: undefined }, { ...plateLine, personalisation: 'SMX  6769 L' },
    { ...plateLine, personalisation: 'X<script>' }, { ...name, personalisation: 'ABCDEFGHIJK' },
    { ...plate(), productSlug: 'bean-keycap' },
  ]) assert.equal(quoteCommerce(intent([invalid]), catalogue), null)
})

test('server quotes approved name lengths, Halloween layouts and extra keycaps', () => {
  assert.equal(quoteCommerce(intent([{ productSlug: 'custom-name-keychain', colour: 'Cream', quantity: 1, personalisation: 'JO' }]), catalogue).lines[0].unitAmountMinor, 790)
  const halloweenConfiguration = { version: 1, layout: '4x1', boardColour: 'Cream', slots: ['ghost', 'ghost', 'ghost', 'ghost'], extras: ['pumpkin'] }
  assert.equal(quoteCommerce(intent([{ productSlug: 'halloween-clicker', colour: 'Cream', quantity: 1, halloweenConfiguration }]), catalogue).lines[0].unitAmountMinor, 1440)
  assert.equal(quoteCommerce(intent([{ productSlug: 'halloween-clicker', colour: 'Purple', quantity: 1, halloweenConfiguration: { ...halloweenConfiguration, boardColour: 'Purple' } }]), catalogue), null)
  assert.equal(quoteCommerce(intent([{ productSlug: 'halloween-clicker', colour: 'Cream', quantity: 1, halloweenConfiguration }]), { products: [] }), null)
})

test('Singapore threshold and Malaysia pending carrier quote', () => {
  const lowCatalogue = { products: [{ slug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain', variants: [{ colour: 'Red', priceMinor: 1999, currency: 'SGD' }] }] }
  assert.equal(quoteCommerce(intent([plate()]), lowCatalogue).shipping.amountMinor, 390)
  lowCatalogue.products[0].variants[0].priceMinor = 4000
  assert.equal(quoteCommerce(intent([plate()]), lowCatalogue).shipping.amountMinor, 0)
  const malaysia = quoteCommerce(intent([plate()], 'MY'), catalogue)
  assert.deepEqual(malaysia.shipping, { status: 'requires_carrier_quote', country: 'MY' })
  assert.equal(malaysia.payableTotalMinor, null)
})

test('excluded, unavailable, inactive and invalid variants fail closed', () => {
  for (const line of [
    plate({ productSlug: 'custom-name-keychain' }), plate({ productSlug: 'skadis' }),
    plate({ colour: 'Pink' }), plate({ quantity: 0 }), plate({ quantity: 101 }),
    plate({ quantity: 1.5 }), plate({ standDesign: 'Bee' }),
    { productSlug: 'qr-nfc-stand', colour: 'Black', quantity: 1, standDesign: 'Fox' },
  ]) assert.equal(quoteCommerce(intent([line]), catalogue), null)
  assert.equal(quoteCommerce(intent([plate()]), { products: [] }), null)
  assert.equal(quoteCommerce(intent([plate()]), { products: [{ ...catalogue.products[0], variants: [] }] }), null)
  assert.equal(quoteCommerce(intent([plate()]), { products: [{ ...catalogue.products[0], variants: [{ colour: 'Red', priceMinor: 490, currency: 'MYR' }] }] }), null)
  assert.equal(quoteCommerce(intent([plate()], 'US'), catalogue), null)
})

test('Studio requires complete configuration and server-owned pricing', () => {
  const line = { productSlug: 'custom-keycaps', quantity: 1, colour: 'Cream',
    configuration: { schemaVersion: 3, boardColour: 'Cream', characters: [{ character: 'A', colour: 'Black' }] } }
  assert.equal(quoteCommerce(intent([line]), catalogue).lines[0].unitAmountMinor, 1300)
  assert.equal(quoteCommerce(intent([line]), { products: catalogue.products }), null)
  assert.equal(quoteCommerce(intent([{ ...line, configuration: { ...line.configuration, characters: [{ character: 'a', colour: 'Black' }] } }]), catalogue), null)
  assert.equal(quoteCommerce(intent([{ ...line, colour: 'Pink' }]), catalogue), null)
})
