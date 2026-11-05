import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const environment = {
  SITE_URL: 'https://beanforge3d.com',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'private-test-key',
  STRIPE_SECRET_KEY: 'sk_live_mock',
  STRIPE_WEBHOOK_SECRET: 'whsec_live_mock',
  STRIPE_ENVIRONMENT: 'live',
}
const sessionId = 'cs_live_1234567890'
const originalFetch = globalThis.fetch
let handler
let order = { id: crypto.randomUUID(), status: 'pending', stripe_session_id: null, currency: 'SGD', amount_total_minor: 880 }
const calls = []
globalThis.Deno = { env: { get: name => environment[name] }, serve: callback => { handler = callback } }
globalThis.fetch = async (input, options = {}) => {
  const url = String(input)
  calls.push({ url, options })
  if (url.includes('/rest/v1/products?')) return Response.json([{ id: 'plate-id', slug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain' }])
  if (url.includes('/rest/v1/product_variants?')) return Response.json([{ product_id: 'plate-id', colour_id: 'red-id', price_minor: 490, currency: 'SGD' }])
  if (url.includes('/rest/v1/colours?')) return Response.json([{ id: 'red-id', name: 'Red' }])
  if (url.includes('/rest/v1/orders')) {
    if (options.method === 'POST') { order = { ...order, ...JSON.parse(options.body) }; return Response.json([order]) }
    if (options.method === 'PATCH') { order = { ...order, ...JSON.parse(options.body) }; return Response.json([order]) }
    return Response.json([order])
  }
  if (url === 'https://api.stripe.com/v1/checkout/sessions') return Response.json({ id: sessionId, livemode: true, url: 'https://checkout.stripe.com/c/pay/live-session' })
  if (url.endsWith('/' + sessionId)) return Response.json({ payment_status: 'paid', livemode: true, currency: 'sgd', amount_total: 880, metadata: { checkout_source: 'beanforge3d' } })
  throw new Error('Unexpected request')
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let modeHelpers
try {
  await server.ssrLoadModule('/supabase/functions/commerce-checkout/index.ts')
  modeHelpers = await server.ssrLoadModule('/supabase/functions/_shared/stripeMode.ts')
} finally { await server.close() }
const checkout = handler

function request(action, input) {
  return checkout(new Request(environment.SUPABASE_URL + '/functions/v1/commerce-checkout', {
    method: 'POST', headers: { Origin: environment.SITE_URL }, body: JSON.stringify({ action, ...input }),
  }))
}

test('live checkout uses live key, validates live session and records pending order', async () => {
  const intent = { country: 'SG', lines: [{ productSlug: 'custom-carplate-keychain', colour: 'Red', quantity: 1, personalisation: 'ABC 123' }] }
  const response = await request('checkout', { intent })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).url, 'https://checkout.stripe.com/c/pay/live-session')
  assert.equal(order.stripe_session_id, sessionId)
  assert.equal(calls.find(call => call.url === 'https://api.stripe.com/v1/checkout/sessions').options.headers.Authorization, 'Bearer sk_live_mock')
  const status = await request('session', { sessionId })
  assert.equal(status.status, 200)
  assert.equal((await status.json()).livemode, true)
  assert.equal((await request('session', { sessionId: 'cs_test_1234567890' })).status, 400)
})

test('payment modes reject opposite keys, sessions and invalid configuration', () => {
  assert.equal(modeHelpers.stripeMode('other'), null)
  assert.equal(modeHelpers.validStripeKey('live', 'sk_test_mock'), false)
  assert.equal(modeHelpers.validStripeKey('test', 'sk_live_mock'), false)
  assert.equal(modeHelpers.validSessionId('live', 'cs_test_1234567890'), false)
  assert.equal(modeHelpers.matchesStripeMode('live', false), false)
})

test('live webhook records only matching signed live events', async () => {
  const webhookServer = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try { await webhookServer.ssrLoadModule('/supabase/functions/commerce-webhook/index.ts') } finally { await webhookServer.close() }
  const webhook = handler
  const session = { id: sessionId, livemode: true, payment_status: 'paid', currency: 'sgd', amount_total: 880,
    client_reference_id: order.id, metadata: { checkout_source: 'beanforge3d', order_id: order.id } }
  const signed = async event => {
    const raw = JSON.stringify(event)
    const timestamp = Math.floor(Date.now() / 1000)
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(environment.STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + raw)))
    const digest = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    return webhook(new Request(environment.SUPABASE_URL + '/functions/v1/commerce-webhook', {
      method: 'POST', headers: { 'Stripe-Signature': 't=' + timestamp + ',v1=' + digest }, body: raw,
    }))
  }
  assert.equal((await signed({ type: 'checkout.session.completed', livemode: false, data: { object: session } })).status, 422)
  assert.equal(order.status, 'pending')
  assert.equal((await signed({ type: 'checkout.session.completed', livemode: true, data: { object: session } })).status, 200)
  assert.equal(order.status, 'paid')
})

test.after(() => { globalThis.fetch = originalFetch; delete globalThis.Deno })
