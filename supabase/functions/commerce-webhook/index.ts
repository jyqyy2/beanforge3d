import { findOrderBySession, recordPaidOrder } from '../_shared/orders.ts'

const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}

async function validSignature(raw: string, header: string | null): Promise<boolean> {
  if (!signingSecret?.startsWith('whsec_') || !header) return false
  const parts = header.split(',').map(part => part.trim().split('='))
  const timestamp = parts.find(part => part[0] === 't')?.[1]
  const signatures = parts.filter(part => part[0] === 'v1').map(part => part[1])
  if (!timestamp || !/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 ||
    signatures.length === 0) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`)))
  const expected = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')
  return signatures.some(signature => /^[a-f0-9]{64}$/.test(signature) && constantTimeEqual(expected, signature))
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function safeText(value: unknown, limit: number): string | null {
  return typeof value === 'string' && value.length <= limit ? value : null
}

function shippingDetails(session: Record<string, unknown>) {
  const collected = record(session.collected_information)
  const customer = record(session.customer_details)
  const shipping = record(collected?.shipping_details ?? session.shipping_details)
  const address = record(shipping?.address ?? customer?.address)
  const fields = ['line1', 'line2', 'city', 'state', 'postal_code', 'country'] as const
  return {
    customer_email: safeText(customer?.email, 320),
    shipping_name: safeText(shipping?.name ?? customer?.name, 255),
    shipping_address: address ? Object.fromEntries(fields.map(field => [field, safeText(address[field], 255)])) : null,
  }
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (Number(request.headers.get('Content-Length') ?? 0) > 65_536) return json({ error: 'Invalid request' }, 413)
  const raw = await request.text()
  if (raw.length > 65_536 || !await validSignature(raw, request.headers.get('Stripe-Signature'))) {
    return json({ error: 'Invalid signature' }, 400)
  }
  try {
    const event = record(JSON.parse(raw))
    if (event?.type !== 'checkout.session.completed' && event?.type !== 'checkout.session.async_payment_succeeded') return json({ received: true })
    const session = record(record(event.data)?.object)
    if (!session || session.payment_status !== 'paid' || session.currency !== 'sgd' ||
      typeof session.id !== 'string' || !/^cs_test_[A-Za-z0-9_]{10,}$/.test(session.id) ||
      !Number.isSafeInteger(session.amount_total) ||
      record(session.metadata)?.checkout_source !== 'beanforge3d') return json({ error: 'Invalid session' }, 422)
    const order = await findOrderBySession(session.id)
    if (!order) return json({ error: 'Order unavailable' }, 503)
    if (order.id !== session.client_reference_id || order.id !== record(session.metadata)?.order_id ||
      order.currency !== 'SGD' || order.amount_total_minor !== session.amount_total) return json({ error: 'Order mismatch' }, 422)
    if (order.status === 'paid') return json({ received: true })
    if (order.status !== 'pending') return json({ error: 'Order unavailable' }, 503)
    if (!await recordPaidOrder(order, shippingDetails(session))) {
      const current = await findOrderBySession(session.id)
      if (current?.status !== 'paid') return json({ error: 'Order unavailable' }, 503)
    }
    return json({ received: true })
  } catch {
    return json({ error: 'Order unavailable' }, 503)
  }
})
