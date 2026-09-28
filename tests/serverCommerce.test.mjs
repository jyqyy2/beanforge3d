import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let quoteCommerce
try { ({ quoteCommerce } = await server.ssrLoadModule('/supabase/functions/_shared/commerce.ts')) } finally { await server.close() }

const catalogue = {
  products: [
    { slug: 'bean-keycap', name: 'Bean Keycap', variants: [{ colour: 'Cream', priceMinor: 1800, currency: 'SGD' }] },
    { slug: 'qr-nfc-stand', name: 'QR / NFC Stand', variants: [{ colour: 'Black', priceMinor: 1500, currency: 'SGD' }] },
  ],
  studioPricing: {
    boardPricesMinor: { 1: 1000, 2: 1800 },
    characterPricesMinor: { A: 300, B: 300 },
    boardColours: ['Cream'],
    characterColours: ['Cream', 'Pink', 'Blue', 'Black'],
  },
}
const bean = (overrides = {}) => ({ productSlug: 'bean-keycap', colour: 'Cream', quantity: 1, ...overrides })
const intent = (lines, country = 'SG') => ({ lines, country })

test('server prices merchandise and shipping without accepting browser amounts', () => {
  const result = quoteCommerce({
    ...intent([bean({ price: 1, name: 'Fake', subtotal: 0 }), bean({ quantity: 1 })]),
    shipping: 0, total: 0, price: 0,
  }, catalogue)
  assert.equal(result.merchandiseSubtotalMinor, 3600)
  assert.deepEqual(result.lines.map(line => line.unitAmountMinor), [1800, 1800])
  assert.equal(result.shipping.amountMinor, 0)
  assert.equal(result.payableTotalMinor, 3600)
})

test('Singapore threshold and Malaysia pending carrier quote', () => {
  const lowCatalogue = { products: [{ slug: 'bean-keycap', name: 'Bean Keycap', variants: [{ colour: 'Cream', priceMinor: 1999, currency: 'SGD' }] }] }
  assert.equal(quoteCommerce(intent([bean()]), lowCatalogue).shipping.amountMinor, 500)
  lowCatalogue.products[0].variants[0].priceMinor = 2000
  assert.equal(quoteCommerce(intent([bean()]), lowCatalogue).shipping.amountMinor, 0)
  const malaysia = quoteCommerce(intent([bean()], 'MY'), catalogue)
  assert.deepEqual(malaysia.shipping, { status: 'requires_carrier_quote', country: 'MY' })
  assert.equal(malaysia.payableTotalMinor, null)
})

test('excluded, unavailable, inactive and invalid variants fail closed', () => {
  for (const line of [
    bean({ productSlug: 'custom-name-keychain' }), bean({ productSlug: 'skadis' }),
    bean({ colour: 'Pink' }), bean({ quantity: 0 }), bean({ quantity: 101 }),
    bean({ quantity: 1.5 }), bean({ standDesign: 'Bee' }),
    { productSlug: 'qr-nfc-stand', colour: 'Black', quantity: 1, standDesign: 'Fox' },
  ]) assert.equal(quoteCommerce(intent([line]), catalogue), null)
  assert.equal(quoteCommerce(intent([bean()]), { products: [] }), null)
  assert.equal(quoteCommerce(intent([bean()]), { products: [{ ...catalogue.products[0], variants: [] }] }), null)
  assert.equal(quoteCommerce(intent([bean()]), { products: [{ ...catalogue.products[0], variants: [{ colour: 'Cream', priceMinor: 1800, currency: 'MYR' }] }] }), null)
  assert.equal(quoteCommerce(intent([bean()], 'US'), catalogue), null)
})

test('Studio requires complete configuration and server-owned pricing', () => {
  const line = { productSlug: 'custom-keycaps', quantity: 1, colour: 'Cream',
    configuration: { schemaVersion: 3, boardColour: 'Cream', characters: [{ character: 'A', colour: 'Black' }] } }
  assert.equal(quoteCommerce(intent([line]), catalogue).lines[0].unitAmountMinor, 1300)
  assert.equal(quoteCommerce(intent([line]), { products: catalogue.products }), null)
  assert.equal(quoteCommerce(intent([{ ...line, configuration: { ...line.configuration, characters: [{ character: 'a', colour: 'Black' }] } }]), catalogue), null)
  assert.equal(quoteCommerce(intent([{ ...line, colour: 'Pink' }]), catalogue), null)
})
