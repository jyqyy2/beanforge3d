import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
let cartItemIdentity, loadCart, readStandDraft, saveStandDraft, standDraftKey
try {
  ;({ cartItemIdentity } = await server.ssrLoadModule('/src/utils/cartIdentity.ts'))
  ;({ loadCart } = await server.ssrLoadModule('/src/utils/cartStorage.ts'))
  ;({ readStandDraft, saveStandDraft, standDraftKey } = await server.ssrLoadModule('/src/utils/standDraft.ts'))
} finally {
  await server.close()
}
const legacy = { productSlug: 'qr-nfc-stand', name: 'QR / NFC Stand', price: 15, colour: 'Black', quantity: 1 }

test('stand draft validates, preserves unreadable values and blocks unsafe writes', () => {
  const previous = globalThis.localStorage
  const values = new Map()
  const product = { standDesigns: [{ name: 'Chick' }, { name: 'Bee' }], colours: ['Black', 'White', 'Orange'] }
  const draft = { design: 'Bee', colour: 'White', quantity: 2 }
  try {
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
    assert.deepEqual(readStandDraft(product), { draft: null, status: 'ready' })
    assert.equal(saveStandDraft(draft, product), true)
    assert.deepEqual(readStandDraft(product), { draft, status: 'ready' })
    for (const invalid of ['broken', JSON.stringify({ ...draft, design: 'Fox' }), JSON.stringify({ ...draft, colour: 'Blue' }), JSON.stringify({ ...draft, quantity: 0 })]) {
      values.set(standDraftKey, invalid)
      assert.deepEqual(readStandDraft(product), { draft: null, status: 'invalid' })
      assert.equal(values.get(standDraftKey), invalid)
    }
    values.set(standDraftKey, 'broken')
    assert.equal(saveStandDraft(draft, product), true)
    assert.equal(values.get(`${standDraftKey}-recovery`), 'broken')
    values.set(standDraftKey, 'another broken draft')
    assert.equal(saveStandDraft(draft, product), false)
    assert.equal(values.get(standDraftKey), 'another broken draft')
    globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('Write blocked') } }
    assert.equal(saveStandDraft(draft, product), false)
    globalThis.localStorage = { getItem: () => { throw new Error('Read blocked') }, setItem: () => assert.fail('Must not write') }
    assert.deepEqual(readStandDraft(product), { draft: null, status: 'read-failed' })
    assert.equal(saveStandDraft(draft, product), false)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})

test('stand identity separates designs and legacy items without changing ordinary identities', () => {
  assert.equal(cartItemIdentity(legacy), '["qr-nfc-stand","Black"]')
  const chick = { ...legacy, standDesign: 'Chick' }
  const bee = { ...legacy, standDesign: 'Bee' }
  assert.notEqual(cartItemIdentity(chick), cartItemIdentity(bee))
  assert.notEqual(cartItemIdentity(chick), cartItemIdentity(legacy))
  assert.equal(cartItemIdentity(chick), cartItemIdentity({ ...chick, quantity: 3 }))
  assert.notEqual(cartItemIdentity(chick), cartItemIdentity({ ...chick, colour: 'White' }))
})

test('saved stands preserve both designs and old items, rejecting malformed designs', () => {
  const previous = globalThis.localStorage
  try {
    const items = [legacy, { ...legacy, standDesign: 'Chick' }, { ...legacy, standDesign: 'Bee' }]
    globalThis.localStorage = { getItem: () => JSON.stringify(items) }
    assert.deepEqual(loadCart(), { items, status: 'loaded' })
    for (const item of [{ ...legacy, standDesign: 'Fox' }, { ...legacy, standDesign: null }, { ...legacy, productSlug: 'bean-keycap', standDesign: 'Bee' }]) {
      globalThis.localStorage = { getItem: () => JSON.stringify([item]) }
      assert.deepEqual(loadCart(), { items: [], status: 'invalid-data' })
    }
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})
