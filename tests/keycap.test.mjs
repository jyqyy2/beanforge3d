import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let pricing, calculateKeycapPrice, isKeycapConfiguration, cartItemIdentity, updateKeycapCart, parseKeycapDraft, readKeycapDraft, saveKeycapDraft, saveCart
try {
  pricing = (await server.ssrLoadModule('/src/data/catalogue.ts')).getCustomKeycapPricing()
  ;({ calculateKeycapPrice } = await server.ssrLoadModule('/src/utils/keycapPricing.ts'))
  ;({ isKeycapConfiguration, cartItemIdentity } = await server.ssrLoadModule('/src/utils/cartIdentity.ts'))
  ;({ updateKeycapCart } = await server.ssrLoadModule('/src/utils/updateKeycapCart.ts'))
  ;({ parseKeycapDraft, readKeycapDraft, saveKeycapDraft } = await server.ssrLoadModule('/src/utils/keycapDraft.ts'))
  ;({ saveCart } = await server.ssrLoadModule('/src/utils/cartStorage.ts'))
} finally {
  await server.close()
}

const configuration = (text = 'A') => ({ schemaVersion: 3, boardColour: 'Cream', characters: Array.from(text, character => ({ character, colour: 'Black' })) })
const cartItem = (config = configuration(), quantity = 1) => ({ productSlug: 'custom-keycaps', name: 'Custom keycaps', price: 13, colour: config.boardColour, quantity, configuration: config })

for (let count = 1; count <= 8; count++) {
  test(`${count} active characters have the expected board and character price`, () => {
    const config = configuration('ABCDEFGH'.slice(0, count))
    assert.equal(isKeycapConfiguration(config), true)
    assert.deepEqual(calculateKeycapPrice(config, pricing), { boardMinor: 1000 + (count - 1) * 800, charactersMinor: count * 300, totalMinor: 1000 + (count - 1) * 800 + count * 300, completed: count, complete: true })
  })
}

test('all A–Z and 0–9 characters are valid and priced', () => {
  for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    assert.equal(isKeycapConfiguration(configuration(character)), true)
    assert.equal(calculateKeycapPrice(configuration(character), pricing).totalMinor, 1300)
  }
})

test('blank or unsupported characters cannot form a complete cart configuration', () => {
  for (const character of ['', 'a', '?', 'AA', '😀']) {
    const config = configuration()
    config.characters[0].character = character
    assert.equal(isKeycapConfiguration(config), false)
    assert.equal(calculateKeycapPrice(config, pricing).complete, false)
    assert.equal(calculateKeycapPrice(config, pricing).completed, 0)
  }
  assert.equal(isKeycapConfiguration({ ...configuration(), characters: [{ character: '', colour: '' }] }, true), true)
})

test('invalid counts and unsafe prices do not produce a complete quote', () => {
  for (const text of ['', 'ABCDEFGHI']) assert.equal(calculateKeycapPrice(configuration(text), pricing).complete, false)
  for (const price of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(calculateKeycapPrice(configuration(), { ...pricing, boardPricesMinor: { 1: price } }).complete, false)
    assert.equal(calculateKeycapPrice(configuration(), { ...pricing, characterPricesMinor: { A: price } }).complete, false)
  }
  assert.equal(calculateKeycapPrice(configuration(), { ...pricing, boardPricesMinor: { 1: Number.MAX_SAFE_INTEGER } }).totalMinor, null)
})

test('three colour layers never affect pricing and invalid colours are rejected', () => {
  for (const boardColour of ['Cream', 'Pink', 'Black']) for (const colour of ['Cream', 'Pink', 'Blue', 'Black']) for (const characterColour of [undefined, 'Cream', 'Pink', 'Blue', 'Black']) {
    const config = { ...configuration(), boardColour, characters: [{ character: 'A', colour, characterColour }] }
    assert.equal(isKeycapConfiguration(config), true)
    assert.equal(calculateKeycapPrice(config, pricing).totalMinor, 1300)
  }
  assert.equal(isKeycapConfiguration({ ...configuration(), boardColour: 'Unknown' }), false)
  for (const field of ['colour', 'characterColour']) {
    const config = configuration()
    config.characters[0][field] = 'Unknown'
    assert.equal(isKeycapConfiguration(config), false)
  }
})

test('cart identity includes each colour layer and normalizes automatic contrast', () => {
  const original = cartItem()
  const explicit = structuredClone(original)
  explicit.configuration.characters[0].characterColour = 'Cream'
  assert.equal(cartItemIdentity(original), cartItemIdentity(explicit))
  for (const field of ['character', 'colour', 'characterColour']) {
    const changed = structuredClone(original)
    changed.configuration.characters[0][field] = field === 'character' ? 'B' : 'Pink'
    assert.notEqual(cartItemIdentity(original), cartItemIdentity(changed))
  }
  const changed = structuredClone(original)
  changed.configuration.boardColour = 'Pink'
  assert.notEqual(cartItemIdentity(original), cartItemIdentity(changed))
})

test('cart edits snapshot the configuration, reprice it, and preserve quantity', () => {
  const original = cartItem(configuration(), 2)
  const config = configuration('B2')
  const result = updateKeycapCart([original], cartItemIdentity(original), config)
  assert.equal(result[0].price, 24)
  assert.equal(result[0].quantity, 2)
  assert.equal(result[0].name, 'Custom keycaps · B2')
  config.characters[0].character = 'Z'
  assert.equal(result[0].configuration.characters[0].character, 'B')
  assert.equal(original.configuration.characters[0].character, 'A')
})

test('matching cart edits merge quantities without mutating the source', () => {
  const original = cartItem(configuration('A'), 2)
  const target = cartItem(configuration('B'), 3)
  const result = updateKeycapCart([original, target], cartItemIdentity(original), configuration('B'))
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 5)
  assert.equal(target.quantity, 3)
  assert.equal(updateKeycapCart([original], 'missing', configuration('B')), null)
  assert.equal(updateKeycapCart([original], cartItemIdentity(original), configuration('')), null)
  assert.equal(updateKeycapCart([original, { ...target, quantity: Number.MAX_SAFE_INTEGER }], cartItemIdentity(original), configuration('B')), null)
})

test('draft roundtrip retains hidden characters and colours while active pricing uses only selected slots', () => {
  const config = configuration('ABCDEFGH')
  config.characters[7] = { character: '8', colour: 'Pink', characterColour: 'Blue' }
  const restored = parseKeycapDraft(JSON.stringify({ version: 1, count: 1, configuration: config }))
  assert.deepEqual(restored.configuration, config)
  assert.equal(restored.count, 1)
  assert.equal(calculateKeycapPrice({ ...config, characters: restored.configuration.characters.slice(0, restored.count) }, pricing).totalMinor, 1300)
  assert.deepEqual(restored.configuration.characters[7], config.characters[7])
  assert.equal(calculateKeycapPrice(restored.configuration, pricing).totalMinor, 9000)
})

test('malformed drafts fail safely', () => {
  for (const raw of [null, '{', 'null', '{}']) assert.equal(parseKeycapDraft(raw), null)
  for (const count of [0, 9, 1.5, '1']) assert.equal(parseKeycapDraft(JSON.stringify({ version: 1, count, configuration: configuration('ABCDEFGH') })), null)
  assert.equal(parseKeycapDraft(JSON.stringify({ version: 2, count: 1, configuration: configuration('ABCDEFGH') })), null)
  assert.equal(parseKeycapDraft(JSON.stringify({ version: 1, count: 1, configuration: configuration('A') })), null)
})

test('browser persistence uses separate draft/cart keys and handles storage failure', context => {
  const storage = new Map()
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: undefined })
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  })
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
  const draft = { version: 1, count: 1, configuration: configuration('ABCDEFGH') }
  assert.equal(saveKeycapDraft(draft), true)
  assert.deepEqual(readKeycapDraft(), draft)
  assert.equal(saveCart([cartItem()]), true)
  assert.deepEqual([...storage.keys()].sort(), ['beanforge-cart', 'beanforge-keycap-draft'])
  assert.deepEqual(readKeycapDraft(), draft)
  globalThis.localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('quota') } }
  assert.equal(readKeycapDraft(), null)
  assert.equal(saveKeycapDraft(draft), false)
  assert.equal(saveCart([cartItem()]), false)
})
