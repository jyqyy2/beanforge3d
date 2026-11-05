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
  assert.equal(quote?.merchandiseSubtotalMinor, 980 + 690 + 3180 + 490)
  assert.deepEqual(quote?.lines.map(line => line.unitAmountMinor), [490, 690, 1590, 490])
  assert.equal(quote?.lines[0].personalisation, 'SMX 6769 L')
})

test('rejects excluded products, invalid colours/designs/configurations and quantities', () => {
  for (const line of [
    { productSlug: 'custom-name-keychain', quantity: 1, colour: 'Cream' },
    plate({ colour: 'Purple' }), plate({ personalisation: 'bad!' }), plate({ personalisation: '' }),
    name({ personalisation: 'ABCDEFGHIJK' }), name({ personalisation: '7' }), stand({ standDesign: 'Fox' }), keycaps('a'), keycaps('A', { colour: 'Pink' }),
    plate({ quantity: 0 }), plate({ quantity: -1 }), plate({ quantity: 1.5 }), plate({ quantity: 101 }), plate({ quantity: Number.MAX_SAFE_INTEGER + 1 }),
  ]) assert.equal(quoteMerchandise([line]), null)
})

test('name length, Halloween layouts, and optional extras use approved prices', () => {
  for (let length = 1; length <= 10; length++) assert.equal(quoteMerchandise([name({ personalisation: 'A'.repeat(length) })])?.lines[0].unitAmountMinor, 690 + (length - 1) * 100)
  for (const [layout, count, price] of [['1x1', 1, 790], ['2x1', 2, 990], ['2x2', 4, 1190], ['4x1', 4, 1190]]) {
    const halloweenConfiguration = { version: 1, layout, boardColour: 'Cream', slots: Array.from({ length: count }, () => 'ghost'), extras: ['pumpkin', 'skull'] }
    assert.equal(quoteMerchandise([{ productSlug: 'halloween-clicker', quantity: 1, colour: 'Cream', halloweenConfiguration }])?.lines[0].unitAmountMinor, price + 500)
  }
  const extraCharacters = [{ character: 'Z', colour: 'Pink' }]
  assert.equal(quoteMerchandise([keycaps('AB', { configuration: { ...keycaps('AB').configuration, extraCharacters } })])?.lines[0].unitAmountMinor, 890)
})

test('does not trust fake subtotal or line totals', () => {
  const quote = quoteMerchandise([{ ...plate(), price: 1, subtotal: 1, lineAmountMinor: 1 }])
  assert.equal(quote?.merchandiseSubtotalMinor, 490)
})

test('applies Singapore threshold before shipping', () => {
  assert.equal(quoteShipping({ country: 'SG' }, 3999).amountMinor, 390)
  assert.equal(quoteShipping({ country: 'SG' }, 4000).amountMinor, 0)
  assert.equal(quoteShipping({ country: 'SG' }, 4500).amountMinor, 0)
})

test('keeps Malaysia carrier-dependent and rejects other countries', () => {
  assert.deepEqual(quoteShipping({ country: 'MY' }, 100), { status: 'requires-carrier-quote', country: 'MY' })
  assert.deepEqual(quoteShipping({ country: 'US' }, 100), { status: 'rejected', reason: 'unsupported-country' })
  assert.deepEqual(quoteShipping({ country: 'MY' }, 2000), { status: 'requires-carrier-quote', country: 'MY' })
})
