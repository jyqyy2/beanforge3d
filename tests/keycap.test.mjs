import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let pricing, calculateKeycapPrice, isKeycapConfiguration, cartItemIdentity, updateKeycapCart, parseKeycapDraft, readKeycapDraft, saveKeycapDraft, saveCart, loadCart
try {
  pricing = (await server.ssrLoadModule('/src/data/catalogue.ts')).getCustomKeycapPricing()
  ;({ calculateKeycapPrice } = await server.ssrLoadModule('/src/utils/keycapPricing.ts'))
  ;({ isKeycapConfiguration, cartItemIdentity } = await server.ssrLoadModule('/src/utils/cartIdentity.ts'))
  ;({ updateKeycapCart } = await server.ssrLoadModule('/src/utils/updateKeycapCart.ts'))
  ;({ parseKeycapDraft, readKeycapDraft, saveKeycapDraft } = await server.ssrLoadModule('/src/utils/keycapDraft.ts'))
  ;({ saveCart, loadCart } = await server.ssrLoadModule('/src/utils/cartStorage.ts'))
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
  assert.equal(saveKeycapDraft(draft), false)
  assert.equal(saveCart([cartItem()]), false)
})

test('cart initialization loads valid items and preserves invalid source data until saving', context => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const storage = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  })
  assert.deepEqual(loadCart(), { items: [], status: 'loaded' })
  const ordinary = { productSlug: 'example', name: 'Example', colour: 'Cream', price: 0, quantity: 1 }
  const valid = [cartItem(), ordinary]
  storage.set('beanforge-cart', JSON.stringify(valid))
  assert.deepEqual(loadCart(), { items: valid, status: 'loaded' })
  const invalid = [null, {}, { ...ordinary, quantity: 0 }, { ...ordinary, price: -1 },
    { ...ordinary, image: 5 }, { ...cartItem(), colour: 'Pink' },
    { ...cartItem(), configuration: undefined }, { ...ordinary, configuration: configuration() }]
  for (const raw of ['{broken', 'null', '{}', JSON.stringify([...valid, ...invalid])]) {
    storage.set('beanforge-cart', raw)
    const result = loadCart()
    assert.equal(result.status, 'invalid-data')
    assert.deepEqual(result.items, raw.startsWith('[') ? valid : [])
    assert.equal(storage.get('beanforge-cart'), raw)
    assert.equal(storage.has('beanforge-cart-recovery'), false)
    assert.equal(saveCart(result.items), true)
    assert.equal(storage.get('beanforge-cart-recovery'), raw)
    storage.delete('beanforge-cart-recovery')
  }
})

test('unreadable saved data is preserved and recovery copies are never overwritten', context => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const storage = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  })
  for (const [key, save] of [
    ['beanforge-cart', () => saveCart([])],
    ['beanforge-keycap-draft', () => saveKeycapDraft({ version: 1, count: 1, configuration: configuration('ABCDEFGH') })],
  ]) {
    storage.set(key, '{broken')
    assert.equal(save(), true)
    assert.equal(storage.get(`${key}-recovery`), '{broken')
    storage.set(key, '{different')
    assert.equal(save(), false)
    assert.equal(storage.get(key), '{different')
    assert.equal(storage.get(`${key}-recovery`), '{broken')
  }
  const originalRead = globalThis.localStorage.getItem
  globalThis.localStorage.getItem = () => { throw new Error('initial read blocked') }
  assert.equal(readKeycapDraft(), null)
  globalThis.localStorage.getItem = originalRead
  const before = storage.get('beanforge-keycap-draft')
  assert.equal(saveKeycapDraft({ version: 1, count: 1, configuration: configuration('ABCDEFGH') }), false)
  assert.equal(storage.get('beanforge-keycap-draft'), before)
})

test('cart initialization read failure remains blocked without changing original data', context => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const raw = JSON.stringify([cartItem()])
  let blocked = true
  let writes = 0
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => { if (blocked) throw new Error('blocked'); return raw },
    setItem: () => { writes++ },
  } })
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  })
  assert.deepEqual(loadCart(), { items: [], status: 'read-failed' })
  blocked = false
  assert.deepEqual(loadCart(), { items: [], status: 'read-failed' })
  assert.equal(saveCart([]), false)
  assert.equal(writes, 0)
  assert.equal(globalThis.localStorage.getItem('beanforge-cart'), raw)
})
