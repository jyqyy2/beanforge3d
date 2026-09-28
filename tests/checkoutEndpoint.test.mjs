import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const environment = {
  SITE_URL: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-test-key',
  STRIPE_SECRET_KEY: 'sk_test_mock',
}
let handler
globalThis.Deno = {
  env: { get: name => environment[name] },
  serve: callback => { handler = callback },
}

const originalFetch = globalThis.fetch
const calls = []
globalThis.fetch = async (input, options = {}) => {
  const url = String(input)
  calls.push({ url, options })
  if (url.includes('/rest/v1/products?')) return Response.json([
    { id: 'product-id', slug: 'bean-keycap', name: 'Bean Keycap' },
  ])
  if (url.includes('/rest/v1/product_variants?')) return Response.json([
    { product_id: 'product-id', colour_id: 'colour-id', price_minor: 1800, currency: 'SGD' },
  ])
  if (url.includes('/rest/v1/colours?')) return Response.json([
    { id: 'colour-id', name: 'Cream' },
  ])
  if (url === 'https://api.stripe.com/v1/checkout/sessions') {
    return Response.json({ url: 'https://checkout.stripe.com/c/pay/test-session' })
  }
  if (url.startsWith('https://api.stripe.com/v1/checkout/sessions/cs_test_')) {
    return Response.json({ payment_status: 'paid', currency: 'sgd', amount_total: 2300,
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
    productSlug: 'bean-keycap', quantity: 1, colour: 'Cream',
    price: 1, name: 'Fake', subtotal: 0, shipping: 0, total: 0,
  }], shipping: 0, total: 0 }
  const response = await request('checkout', intent)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.quote.payableTotalMinor, 2300)
  assert.equal(body.url.startsWith('https://checkout.stripe.com/'), true)
  const stripe = calls.find(call => call.url.startsWith('https://api.stripe.com/'))
  assert.ok(stripe)
  const form = new URLSearchParams(stripe.options.body)
  assert.equal(form.get('line_items[0][price_data][unit_amount]'), '1800')
  assert.equal(form.get('line_items[1][price_data][unit_amount]'), '500')
  assert.equal(form.get('shipping_address_collection[allowed_countries][0]'), 'SG')
  assert.equal(form.get('metadata[checkout_source]'), 'beanforge3d')
  assert.equal(calls.filter(call => call.url.includes('/rest/v1/')).every(call =>
    call.options.headers.apikey === environment.SUPABASE_ANON_KEY), true)
})

test('session confirmation requires a BeanForge checkout session', async () => {
  const sessionId = 'cs_test_1234567890'
  const response = await handler(new Request('https://example.supabase.co/functions/v1/commerce-checkout', {
    method: 'POST', headers: { Origin: environment.SITE_URL, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session', sessionId }),
  }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).paid, true)
  const unrelated = await handler(new Request('https://example.supabase.co/functions/v1/commerce-checkout', {
    method: 'POST', headers: { Origin: environment.SITE_URL, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session', sessionId: 'cs_test_1234567890unrelated' }),
  }))
  assert.equal(unrelated.status, 502)
})

test('Malaysia, untrusted origin and missing catalogue fail closed', async () => {
  const intent = { country: 'MY', lines: [{ productSlug: 'bean-keycap', quantity: 1, colour: 'Cream' }] }
  assert.equal((await request('checkout', intent)).status, 409)
  assert.equal((await request('checkout', { ...intent, country: 'SG' }, 'https://other.example')).status, 403)
  const response = await request('checkout', { country: 'SG', lines: [{ ...intent.lines[0], colour: 'Pink' }] })
  assert.equal(response.status, 422)
})

test.after(() => { globalThis.fetch = originalFetch; delete globalThis.Deno })
