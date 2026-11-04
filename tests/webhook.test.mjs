import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

const orderId = '29a20f39-8891-439d-99c7-a56ac78d959a'
const sessionId = 'cs_test_1234567890'
const secret = 'whsec_local_test_secret'
const environment = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'private-test-key',
  STRIPE_WEBHOOK_SECRET: secret,
}
globalThis.Deno = { env: { get: name => environment[name] }, serve: callback => { globalThis.webhookHandler = callback } }
const originalFetch = globalThis.fetch
let order = { id: orderId, stripe_session_id: sessionId, status: 'pending', currency: 'SGD', amount_total_minor: 990 }
const writes = []
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input))
  assert.equal(url.pathname, '/rest/v1/orders')
  assert.equal(options.headers.apikey, environment.SUPABASE_SERVICE_ROLE_KEY)
  if (options.method === 'PATCH') {
    if (order.status !== 'pending') return Response.json([])
    const update = JSON.parse(options.body)
    writes.push(update)
    order = { ...order, ...update }
    return Response.json([order])
  }
  return Response.json([order])
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try { await server.ssrLoadModule('/supabase/functions/commerce-webhook/index.ts') } finally { await server.close() }

const session = () => ({ id: sessionId, client_reference_id: orderId, payment_status: 'paid',
  currency: 'sgd', amount_total: 990, metadata: { checkout_source: 'beanforge3d', order_id: orderId },
  customer_details: { email: 'buyer@example.test', name: 'Jo', address: { line1: 'Example St', country: 'SG' } } })
const event = (object = session(), type = 'checkout.session.completed') => JSON.stringify({ type, data: { object } })

async function signedRequest(raw, timestamp = Math.floor(Date.now() / 1000), signatureOverride) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`)))
  const signature = signatureOverride ?? Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')
  return globalThis.webhookHandler(new Request('https://example.supabase.co/functions/v1/commerce-webhook', {
    method: 'POST', headers: { 'Stripe-Signature': `t=${timestamp},v1=${signature}` }, body: raw,
  }))
}

test('webhook rejects unsigned, tampered and replayed events without writing', async () => {
  const raw = event()
  assert.equal((await globalThis.webhookHandler(new Request('https://example.supabase.co/functions/v1/commerce-webhook', { method: 'POST', body: raw }))).status, 400)
  assert.equal((await signedRequest(raw, Math.floor(Date.now() / 1000) - 601)).status, 400)
  assert.equal((await signedRequest(raw, Math.floor(Date.now() / 1000), 'a'.repeat(64))).status, 400)
  assert.equal(writes.length, 0)
})

test('webhook ignores nonpayment and refuses mismatched amounts or order ids', async () => {
  assert.equal((await signedRequest(event({ ...session(), payment_status: 'unpaid' }))).status, 422)
  assert.equal((await signedRequest(event({ ...session(), amount_total: 1 }))).status, 422)
  assert.equal((await signedRequest(event({ ...session(), client_reference_id: crypto.randomUUID() }))).status, 422)
  assert.equal((await signedRequest(event(session(), 'charge.succeeded'))).status, 200)
  assert.equal(writes.length, 0)
})

test('verified payment records order and duplicate delivery is idempotent', async () => {
  assert.equal((await signedRequest(event())).status, 200)
  assert.equal(order.status, 'paid')
  assert.equal(order.customer_email, 'buyer@example.test')
  assert.deepEqual(order.shipping_address, { line1: 'Example St', line2: null, city: null, state: null, postal_code: null, country: 'SG' })
  assert.equal(writes.length, 1)
  assert.equal((await signedRequest(event())).status, 200)
  assert.equal(writes.length, 1)
})

test.after(() => { globalThis.fetch = originalFetch; delete globalThis.Deno; delete globalThis.webhookHandler })
