import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let quoteMerchandise, quoteShipping
try { ({ quoteMerchandise, quoteShipping } = await server.ssrLoadModule('/src/utils/commerceQuote.ts')) } finally { await server.close() }

const plate = (overrides = {}) => ({ productSlug: 'custom-carplate-keychain', quantity: 1, colour: 'Red', personalisation: 'SMX 6769 L', clientPrice: 999999, ...overrides })
const name = (overrides = {}) => ({ productSlug: 'custom-name-keychain', quantity: 1, colour: 'Cream', personalisation: 'A', ...overrides })
const stand = (overrides = {}) => ({ productSlug: 'qr-nfc-stand', quantity: 1, colour: 'Black', standDesign: 'Chick', ...overrides })
const keycaps = (text = 'A', overrides = {}) => ({ productSlug: 'custom-keycaps', quantity: 1, colour: 'Cream', configuration: { schemaVersion: 3, boardColour: 'Cream', characters: Array.from(text, character => ({ character, colour: 'Black' })) }, ...overrides })

test('ignores client prices and calculates multiple valid V1 lines', () => {
  const quote = quoteMerchandise([plate({ quantity: 2 }), name(), stand({ quantity: 2, standDesign: 'Bee' }), keycaps()])
  assert.equal(quote?.merchandiseSubtotalMinor, 980 + 690 + 3180 + 1300)
  assert.deepEqual(quote?.lines.map(line => line.unitAmountMinor), [490, 690, 1590, 1300])
  assert.equal(quote?.lines[0].personalisation, 'SMX 6769 L')
})

test('rejects excluded products, invalid colours/designs/configurations and quantities', () => {
  for (const line of [
    { productSlug: 'custom-name-keychain', quantity: 1, colour: 'Cream' },
    plate({ colour: 'Purple' }), plate({ personalisation: 'bad!' }), plate({ personalisation: '' }),
    name({ personalisation: 'JO' }), name({ personalisation: '7' }), stand({ standDesign: 'Fox' }), keycaps('a'), keycaps('A', { colour: 'Pink' }),
    plate({ quantity: 0 }), plate({ quantity: -1 }), plate({ quantity: 1.5 }), plate({ quantity: 101 }), plate({ quantity: Number.MAX_SAFE_INTEGER + 1 }),
  ]) assert.equal(quoteMerchandise([line]), null)
})

test('does not trust fake subtotal or line totals', () => {
  const quote = quoteMerchandise([{ ...plate(), price: 1, subtotal: 1, lineAmountMinor: 1 }])
  assert.equal(quote?.merchandiseSubtotalMinor, 490)
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
