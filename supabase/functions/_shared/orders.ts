import type { CommerceQuote } from './commerce.ts'

const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

type OrderRecord = {
  id: string
  stripe_session_id: string | null
  status: 'pending' | 'paid' | 'checkout_failed'
  currency: string
  amount_total_minor: number
}

async function orderRequest(path: string, method: string, body?: unknown): Promise<Response> {
  if (!baseUrl || !serviceKey) throw new Error('Order storage unavailable')
  return fetch(`${baseUrl}/rest/v1/orders${path}`, {
    method,
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

async function readRows(response: Response): Promise<OrderRecord[]> {
  if (!response.ok) throw new Error('Order storage unavailable')
  const rows: unknown = await response.json()
  if (!Array.isArray(rows)) throw new Error('Order storage unavailable')
  return rows as OrderRecord[]
}

export async function createPendingOrder(quote: CommerceQuote): Promise<string> {
  if (quote.payableTotalMinor === null) throw new Error('Order storage unavailable')
  const id = crypto.randomUUID()
  const rows = await readRows(await orderRequest('', 'POST', {
    id, status: 'pending', currency: quote.currency,
    amount_total_minor: quote.payableTotalMinor, quote,
  }))
  if (rows.length !== 1 || rows[0].id !== id) throw new Error('Order storage unavailable')
  return id
}

export async function attachOrderSession(id: string, sessionId: string): Promise<void> {
  const rows = await readRows(await orderRequest(
    `?id=eq.${encodeURIComponent(id)}&status=eq.pending&stripe_session_id=is.null`,
    'PATCH', { stripe_session_id: sessionId },
  ))
  if (rows.length !== 1 || rows[0].stripe_session_id !== sessionId) throw new Error('Order storage unavailable')
}

export async function failPendingOrder(id: string): Promise<void> {
  await readRows(await orderRequest(`?id=eq.${encodeURIComponent(id)}&status=eq.pending`, 'PATCH', { status: 'checkout_failed' }))
}

export async function findOrderBySession(sessionId: string): Promise<OrderRecord | null> {
  const rows = await readRows(await orderRequest(
    `?select=id,stripe_session_id,status,currency,amount_total_minor&stripe_session_id=eq.${encodeURIComponent(sessionId)}`,
    'GET',
  ))
  return rows.length === 1 ? rows[0] : null
}

export async function recordPaidOrder(order: OrderRecord, details: {
  customer_email: string | null
  shipping_name: string | null
  shipping_address: Record<string, string | null> | null
}): Promise<boolean> {
  const rows = await readRows(await orderRequest(
    `?id=eq.${encodeURIComponent(order.id)}&stripe_session_id=eq.${encodeURIComponent(order.stripe_session_id ?? '')}&status=eq.pending`,
    'PATCH', { status: 'paid', paid_at: new Date().toISOString(), ...details },
  ))
  return rows.length === 1 && rows[0].status === 'paid'
}
