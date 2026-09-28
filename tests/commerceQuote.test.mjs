import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let quoteMerchandise, quoteShipping
try { ({ quoteMerchandise, quoteShipping } = await server.ssrLoadModule('/src/utils/commerceQuote.ts')) } finally { await server.close() }

const bean = (overrides = {}) => ({ productSlug: 'bean-keycap', quantity: 1, colour: 'Cream', clientPrice: 999999, ...overrides })
const stand = (overrides = {}) => ({ productSlug: 'qr-nfc-stand', quantity: 1, colour: 'Black', standDesign: 'Chick', ...overrides })
const keycaps = (text = 'A', overrides = {}) => ({ productSlug: 'custom-keycaps', quantity: 1, colour: 'Cream', configuration: { schemaVersion: 3, boardColour: 'Cream', characters: Array.from(text, character => ({ character, colour: 'Black' })) }, ...overrides })

test('ignores client prices and calculates multiple valid V1 lines', () => {
  const quote = quoteMerchandise([bean({ quantity: 2 }), stand({ quantity: 2, standDesign: 'Bee' }), keycaps()])
  assert.equal(quote?.merchandiseSubtotalMinor, 3600 + 3000 + 1300)
  assert.deepEqual(quote?.lines.map(line => line.unitAmountMinor), [1800, 1500, 1300])
})

test('rejects excluded products, invalid colours/designs/configurations and quantities', () => {
  for (const line of [
    { productSlug: 'custom-name-keychain', quantity: 1, colour: 'Cream' },
    bean({ colour: 'Purple' }), stand({ standDesign: 'Fox' }), keycaps('a'), keycaps('A', { colour: 'Pink' }),
    bean({ quantity: 0 }), bean({ quantity: -1 }), bean({ quantity: 1.5 }), bean({ quantity: 101 }), bean({ quantity: Number.MAX_SAFE_INTEGER + 1 }),
  ]) assert.equal(quoteMerchandise([line]), null)
})

test('does not trust fake subtotal or line totals', () => {
  const quote = quoteMerchandise([{ ...bean(), price: 1, subtotal: 1, lineAmountMinor: 1 }])
  assert.equal(quote?.merchandiseSubtotalMinor, 1800)
})

test('applies Singapore threshold before shipping', () => {
  assert.equal(quoteShipping({ country: 'SG' }, 1999).amountMinor, 500)
  assert.equal(quoteShipping({ country: 'SG' }, 2000).amountMinor, 0)
  assert.equal(quoteShipping({ country: 'SG' }, 2500).amountMinor, 0)
})

test('keeps Malaysia carrier-dependent and rejects other countries', () => {
  assert.deepEqual(quoteShipping({ country: 'MY' }, 100), { status: 'requires-carrier-quote', country: 'MY' })
  assert.deepEqual(quoteShipping({ country: 'US' }, 100), { status: 'rejected', reason: 'unsupported-country' })
  assert.deepEqual(quoteShipping({ country: 'MY' }, 2000), { status: 'requires-carrier-quote', country: 'MY' })
})
