import type { CartItem } from '../types/cart'

export type ServerQuote = {
  currency: 'SGD'
  lines: { unitAmountMinor: number; lineAmountMinor: number }[]
  merchandiseSubtotalMinor: number
  shipping: { status: 'quoted'; country: 'SG'; amountMinor: number } |
    { status: 'requires_carrier_quote'; country: 'MY' }
  payableTotalMinor: number | null
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const checkoutConfigured = Boolean(supabaseUrl && anonKey)

function intent(items: CartItem[], country: 'SG' | 'MY') {
  return {
    country,
    lines: items.map(item => ({
      productSlug: item.productSlug,
      quantity: item.quantity,
      colour: item.colour,
      ...(item.standDesign ? { standDesign: item.standDesign } : {}),
      ...(item.configuration ? { configuration: item.configuration } : {}),
    })),
  }
}

async function requestCommerce(action: 'quote' | 'checkout', items: CartItem[], country: 'SG' | 'MY', signal?: AbortSignal) {
  if (!checkoutConfigured) throw new Error('Checkout is not configured.')
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/commerce-checkout`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, intent: intent(items, country) }),
    signal,
  })
  if (!response.ok) throw new Error(response.status === 422 ? 'Some items are not available for checkout.' :
    response.status === 409 ? 'A carrier quote is required for Malaysia.' : 'Checkout is temporarily unavailable.')
  return response.json()
}

export async function requestQuote(items: CartItem[], country: 'SG' | 'MY', signal?: AbortSignal): Promise<ServerQuote> {
  return requestCommerce('quote', items, country, signal) as Promise<ServerQuote>
}

export async function startCheckout(items: CartItem[]): Promise<{ url: string; quote: ServerQuote }> {
  const result = await requestCommerce('checkout', items, 'SG') as { url?: unknown; quote?: ServerQuote }
  if (typeof result.url !== 'string' || !result.url.startsWith('https://checkout.stripe.com/')) {
    throw new Error('Checkout is temporarily unavailable.')
  }
  if (!result.quote || result.quote.shipping.status !== 'quoted' ||
    !Number.isSafeInteger(result.quote.payableTotalMinor)) throw new Error('Checkout is temporarily unavailable.')
  return { url: result.url, quote: result.quote }
}

export async function verifyCheckoutSession(sessionId: string): Promise<{ paid: boolean; amountTotalMinor: number; currency: string }> {
  if (!checkoutConfigured) throw new Error('Checkout is not configured.')
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/commerce-checkout`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'session', sessionId }),
  })
  if (!response.ok) throw new Error('Payment status is unavailable.')
  return response.json()
}
