import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const environment = {
  SITE_URL: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-test-key',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
}
let handler
globalThis.Deno = {
  env: { get: name => environment[name] },
  serve: callback => { handler = callback },
}

const originalFetch = globalThis.fetch
const calls = []
const orders = new Map()
let sessionCount = 0
let failNextOrder = false
let failNextAttach = false
globalThis.fetch = async (input, options = {}) => {
  const url = String(input)
  calls.push({ url, options })
  if (url.includes('/rest/v1/products?')) return Response.json([
    { id: 'plate-id', slug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain' },
    { id: 'name-id', slug: 'custom-name-keychain', name: 'Custom Name Keychain' },
    { id: 'stand-id', slug: 'qr-nfc-stand', name: 'QR / NFC Stand' },
    { id: 'studio-id', slug: 'custom-keycaps', name: 'Keycap Studio' },
    { id: 'halloween-id', slug: 'halloween-clicker', name: 'Halloween Fidget Clicker' },
  ])
  if (url.includes('/rest/v1/product_variants?')) return Response.json([
    { product_id: 'plate-id', colour_id: 'red-id', price_minor: 490, currency: 'SGD' },
    { product_id: 'name-id', colour_id: 'cream-id', price_minor: 690, currency: 'SGD' },
    { product_id: 'stand-id', colour_id: 'black-id', price_minor: 1590, currency: 'SGD' },
    { product_id: 'studio-id', colour_id: 'cream-id', price_minor: 490, currency: 'SGD' },
    { product_id: 'halloween-id', colour_id: 'purple-id', price_minor: 790, currency: 'SGD' },
  ])
  if (url.includes('/rest/v1/colours?')) return Response.json([
    { id: 'red-id', name: 'Red' },
    { id: 'cream-id', name: 'Cream' },
    { id: 'black-id', name: 'Black' },
    { id: 'purple-id', name: 'Purple' },
  ])
  if (url.includes('/rest/v1/orders')) {
    if (failNextOrder) { failNextOrder = false; return Response.json({ error: 'offline' }, { status: 503 }) }
    if (options.method === 'POST') {
      const order = { ...JSON.parse(options.body), stripe_session_id: null }
      orders.set(order.id, order)
      return Response.json([order])
    }
    if (options.method === 'PATCH') {
      if (failNextAttach && JSON.parse(options.body).stripe_session_id) {
        failNextAttach = false
        return Response.json({ error: 'offline' }, { status: 503 })
      }
      const query = new URL(url).searchParams
      const order = orders.get(query.get('id')?.replace('eq.', ''))
      if (!order || order.status !== 'pending') return Response.json([])
      Object.assign(order, JSON.parse(options.body))
      return Response.json([order])
    }
    const requestedSession = new URL(url).searchParams.get('stripe_session_id')?.replace('eq.', '')
    return Response.json([...orders.values()].filter(order => order.stripe_session_id === requestedSession))
  }
  if (url === 'https://api.stripe.com/v1/checkout/sessions') {
    return Response.json({ id: `cs_test_${String(++sessionCount).padStart(10, '0')}`, url: 'https://checkout.stripe.com/c/pay/test-session' })
  }
  if (url.endsWith('/expire')) return Response.json({ status: 'expired' })
  if (url.startsWith('https://api.stripe.com/v1/checkout/sessions/cs_test_')) {
    return Response.json({ payment_status: 'paid', currency: 'sgd', amount_total: 990,
      metadata: url.endsWith('unrelated') ? {} : { checkout_source: 'beanforge3d' } })
  }
  throw new Error('Unexpected HTTP request')
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try { await server.ssrLoadModule('/supabase/functions/commerce-checkout/index.ts') } finally { await server.close() }

function request(action, intent, origin = environment.SITE_URL) {
  return handler(new Request('https://example.supabase.co/functions/v1/commerce-checkout', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, intent }),
  }))
}

test('server reads RLS catalogue, ignores browser amounts and creates Stripe test session', async () => {
  calls.length = 0
  const intent = { country: 'SG', lines: [{
    productSlug: 'custom-carplate-keychain', quantity: 1, colour: 'Red', personalisation: 'SMX 6769 L',
    price: 1, name: 'Fake', subtotal: 0, shipping: 0, total: 0,
  }], shipping: 0, total: 0 }
  const response = await request('checkout', intent)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.quote.payableTotalMinor, 990)
  assert.equal(body.url.startsWith('https://checkout.stripe.com/'), true)
  const stripe = calls.find(call => call.url.startsWith('https://api.stripe.com/'))
  assert.ok(stripe)
  const form = new URLSearchParams(stripe.options.body)
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '490')
  assert.equal(form.get('line_items[1][price_data][unit_amount]'), '500')
  assert.equal(form.get('shipping_address_collection[allowed_countries][0]'), 'SG')
  assert.equal(form.get('metadata[checkout_source]'), 'beanforge3d')
  assert.equal(form.get('client_reference_id'), form.get('metadata[order_id]'))
  assert.equal(orders.get(form.get('client_reference_id')).quote.lines[0].personalisation, 'SMX 6769 L')
  assert.equal(calls.filter(call => call.url.includes('/rest/v1/')).every(call =>
    call.url.includes('/orders') ? call.options.headers.apikey === environment.SUPABASE_SERVICE_ROLE_KEY :
      call.options.headers.apikey === environment.SUPABASE_ANON_KEY), true)
})

test('personalised plate text reaches the Stripe line description', async () => {
  calls.length = 0
  const response = await request('checkout', { country: 'SG', lines: [{
    productSlug: 'custom-carplate-keychain', colour: 'Red', personalisation: 'SMX 6769 L', quantity: 1,
  }] })
  assert.equal(response.status, 200)
  const form = new URLSearchParams(calls.find(call => call.url.startsWith('https://api.stripe.com/')).options.body)
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '490')
  assert.equal(form.get('line_items[0][price_data][product_data][description]'), 'Red · SMX 6769 L')
})

test('approved name, stand, Studio, Halloween and add-on prices reach Stripe and saved order', async () => {
  calls.length = 0
  const lines = [
    { productSlug: 'custom-carplate-keychain', colour: 'Red', personalisation: 'ABC 123', quantity: 1 },
    { productSlug: 'custom-name-keychain', colour: 'Cream', personalisation: 'ABCDEFGHIJ', quantity: 1 },
    { productSlug: 'qr-nfc-stand', colour: 'Black', standDesign: 'Bee', quantity: 1 },
    { productSlug: 'custom-keycaps', colour: 'Cream', quantity: 1, configuration: {
      schemaVersion: 3, boardColour: 'Cream', characters: [{ character: 'A', colour: 'Black' }, { character: 'B', colour: 'Pink' }],
      extraCharacters: [{ character: 'Z', colour: 'Blue' }],
    } },
    { productSlug: 'halloween-clicker', colour: 'Purple', quantity: 1, halloweenConfiguration: {
      version: 1, layout: '2x1', boardColour: 'Purple', slots: ['ghost', 'pumpkin'], extras: ['cat-back', 'skull'],
    } },
  ]
  const response = await request('checkout', { country: 'SG', lines })
  assert.equal(response.status, 200)
  const { quote } = await response.json()
  assert.deepEqual(quote.lines.map(line => line.unitAmountMinor), [490, 1590, 1590, 890, 1490])
  assert.equal(quote.payableTotalMinor, 6050)
  const form = new URLSearchParams(calls.find(call => call.url === 'https://api.stripe.com/v1/checkout/sessions').options.body)
  assert.deepEqual(lines.map((_, index) => Number(form.get(`line_items[${index}][price_data][unit_amount]`))), [490, 1590, 1590, 890, 1490])
  assert.match(form.get('line_items[3][price_data][product_data][description]'), /extra Z:Blue/)
  assert.match(form.get('line_items[4][price_data][product_data][description]'), /cat-back skull/)
  const order = orders.get(form.get('client_reference_id'))
  assert.equal(order.quote.lines[1].personalisation, 'ABCDEFGHIJ')
  assert.deepEqual(order.quote.lines[3].configuration.extraCharacters, lines[3].configuration.extraCharacters)
  assert.deepEqual(order.quote.lines[4].halloweenConfiguration.extras, lines[4].halloweenConfiguration.extras)
})

test('database failure prevents creation of a payable Stripe session', async () => {
  calls.length = 0
  failNextOrder = true
  const response = await request('checkout', { country: 'SG', lines: [{
    productSlug: 'custom-carplate-keychain', colour: 'Red', personalisation: 'ABC 123', quantity: 1,
  }] })
  assert.equal(response.status, 503)
  assert.equal(calls.some(call => call.url.startsWith('https://api.stripe.com/')), false)
})

test('session attachment failure expires Stripe checkout instead of exposing its URL', async () => {
  calls.length = 0
  failNextAttach = true
  const response = await request('checkout', { country: 'SG', lines: [{
    productSlug: 'custom-carplate-keychain', colour: 'Red', personalisation: 'ABC 123', quantity: 1,
  }] })
  assert.equal(response.status, 503)
  assert.equal(calls.some(call => call.url.endsWith('/expire')), true)
  assert.equal([...orders.values()].at(-1).status, 'checkout_failed')
})

test('session confirmation requires a BeanForge checkout session', async () => {
  const sessionId = [...orders.values()].find(order => order.stripe_session_id)?.stripe_session_id
  const response = await handler(new Request('https://example.supabase.co/functions/v1/commerce-checkout', {
    method: 'POST', headers: { Origin: environment.SITE_URL, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session', sessionId }),
  }))
  assert.equal(response.status, 200)
  assert.deepEqual({ paid: (await response.clone().json()).paid, orderRecorded: (await response.json()).orderRecorded },
    { paid: true, orderRecorded: false })
  const unrelated = await handler(new Request('https://example.supabase.co/functions/v1/commerce-checkout', {
    method: 'POST', headers: { Origin: environment.SITE_URL, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session', sessionId: 'cs_test_1234567890unrelated' }),
  }))
  assert.equal(unrelated.status, 502)
})

test('Malaysia, untrusted origin and missing catalogue fail closed', async () => {
  const intent = { country: 'MY', lines: [{ productSlug: 'custom-carplate-keychain', quantity: 1, colour: 'Red', personalisation: 'SMX 6769 L' }] }
  assert.equal((await request('checkout', intent)).status, 409)
  assert.equal((await request('checkout', { ...intent, country: 'SG' }, 'https://other.example')).status, 403)
  const response = await request('checkout', { country: 'SG', lines: [{ ...intent.lines[0], colour: 'Pink' }] })
  assert.equal(response.status, 422)
})

test.after(() => { globalThis.fetch = originalFetch; delete globalThis.Deno })
