import { quoteCommerce } from '../_shared/commerce.ts'
import type { Catalogue, CommerceQuote, PricedProduct } from '../_shared/commerce.ts'

const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/$/, '')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json',
    'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': siteUrl ?? '' } })
}

async function catalogueRows(path: string): Promise<unknown[]> {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Catalogue unavailable')
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  })
  if (!response.ok) throw new Error('Catalogue unavailable')
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Catalogue unavailable')
  return data
}

async function loadCatalogue(): Promise<Catalogue> {
  const products = await catalogueRows('products?select=id,slug,name&slug=in.(bean-keycap,qr-nfc-stand)')
  const ids = products.flatMap(product => {
    if (!product || typeof product !== 'object' || !('id' in product) || typeof product.id !== 'string') return []
    return [product.id]
  })
  if (!ids.length) return { products: [] }
  const variants = await catalogueRows(`product_variants?select=product_id,colour_id,price_minor,currency&product_id=in.(${ids.join(',')})`)
  const colourIds = [...new Set(variants.flatMap(variant => {
    if (!variant || typeof variant !== 'object' || !('colour_id' in variant) || typeof variant.colour_id !== 'string') return []
    return [variant.colour_id]
  }))]
  const colours = colourIds.length ? await catalogueRows(`colours?select=id,name&id=in.(${colourIds.join(',')})`) : []
  const nameById = new Map(colours.flatMap(colour => {
    if (!colour || typeof colour !== 'object' || !('id' in colour) || !('name' in colour) ||
      typeof colour.id !== 'string' || typeof colour.name !== 'string') return []
    return [[colour.id, colour.name] as const]
  }))
  const mapped: PricedProduct[] = products.flatMap(product => {
    if (!product || typeof product !== 'object' || !('id' in product) || !('slug' in product) ||
      !('name' in product) || typeof product.id !== 'string' ||
      typeof product.slug !== 'string' || typeof product.name !== 'string') return []
    return [{ slug: product.slug, name: product.name, variants: variants.flatMap(variant => {
      if (!variant || typeof variant !== 'object' || !('product_id' in variant) ||
        variant.product_id !== product.id || !('colour_id' in variant) ||
        typeof variant.colour_id !== 'string' || !('price_minor' in variant) ||
        !('currency' in variant) || typeof variant.currency !== 'string') return []
      const colour = nameById.get(variant.colour_id)
      return colour && typeof variant.price_minor === 'number'
        ? [{ colour, priceMinor: variant.price_minor, currency: variant.currency }] : []
    }) }]
  })
  const pricingText = Deno.env.get('KEYCAP_STUDIO_PRICING_JSON')
  let studioPricing: Catalogue['studioPricing']
  if (pricingText) {
    const parsed: unknown = JSON.parse(pricingText)
    if (!parsed || typeof parsed !== 'object' || !('boardPricesMinor' in parsed) ||
      !('characterPricesMinor' in parsed) || !('boardColours' in parsed) ||
      !('characterColours' in parsed) || !Array.isArray(parsed.boardColours) ||
      !Array.isArray(parsed.characterColours)) throw new Error('Studio pricing unavailable')
    studioPricing = parsed as Catalogue['studioPricing']
  }
  return { products: mapped, studioPricing }
}

function stripeLineDescription(line: CommerceQuote['lines'][number]): string {
  if (line.configuration) {
    const characters = line.configuration.characters.map(entry => `${entry.character}:${entry.colour}/${entry.characterColour ?? ''}`).join(' ')
    return `Board ${line.configuration.boardColour}; ${characters}`.slice(0, 450)
  }
  return [line.colour, line.standDesign].filter(Boolean).join(' · ')
}

async function createCheckout(quote: CommerceQuote): Promise<Response> {
  if (!siteUrl || !stripeSecretKey?.startsWith('sk_test_') || quote.shipping.status !== 'quoted') {
    return json({ error: 'Checkout unavailable' }, 503)
  }
  const form = new URLSearchParams({
    mode: 'payment',
    'metadata[checkout_source]': 'beanforge3d',
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart?checkout=cancelled`,
    'shipping_address_collection[allowed_countries][0]': 'SG',
  })
  quote.lines.forEach((line, index) => {
    form.set(`line_items[${index}][price_data][currency]`, 'sgd')
    form.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitAmountMinor))
    form.set(`line_items[${index}][price_data][product_data][name]`, line.name)
    form.set(`line_items[${index}][price_data][product_data][description]`, stripeLineDescription(line))
    form.set(`line_items[${index}][quantity]`, String(line.quantity))
  })
  if (quote.shipping.amountMinor > 0) {
    const index = quote.lines.length
    form.set(`line_items[${index}][price_data][currency]`, 'sgd')
    form.set(`line_items[${index}][price_data][unit_amount]`, String(quote.shipping.amountMinor))
    form.set(`line_items[${index}][price_data][product_data][name]`, 'Singapore delivery')
    form.set(`line_items[${index}][quantity]`, '1')
  }
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  if (!response.ok) return json({ error: 'Payment provider unavailable' }, 502)
  const session: unknown = await response.json()
  if (!session || typeof session !== 'object' || !('url' in session) ||
    typeof session.url !== 'string' || !session.url.startsWith('https://checkout.stripe.com/')) {
    return json({ error: 'Payment provider unavailable' }, 502)
  }
  return json({ url: session.url, quote })
}

async function sessionStatus(sessionId: unknown): Promise<Response> {
  if (typeof sessionId !== 'string' || !/^cs_test_[A-Za-z0-9_]{10,}$/.test(sessionId) ||
    !stripeSecretKey?.startsWith('sk_test_')) return json({ error: 'Invalid session' }, 400)
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  })
  if (!response.ok) return json({ error: 'Session unavailable' }, 502)
  const session: unknown = await response.json()
  if (!session || typeof session !== 'object' || !('payment_status' in session) ||
    !('currency' in session) || !('amount_total' in session) ||
    !('metadata' in session) || !session.metadata || typeof session.metadata !== 'object' ||
    !('checkout_source' in session.metadata) || session.metadata.checkout_source !== 'beanforge3d') {
    return json({ error: 'Session unavailable' }, 502)
  }
  return json({ paid: session.payment_status === 'paid',
    amountTotalMinor: session.amount_total, currency: session.currency })
}

Deno.serve(async request => {
  if (!siteUrl || request.headers.get('Origin') !== siteUrl) return json({ error: 'Forbidden' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': siteUrl, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  } })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (Number(request.headers.get('Content-Length') ?? 0) > 16_384) return json({ error: 'Invalid request' }, 413)
  try {
    const raw = await request.text()
    if (raw.length > 16_384) return json({ error: 'Invalid request' }, 413)
    const payload: unknown = JSON.parse(raw)
    if (!payload || typeof payload !== 'object' || !('action' in payload) ||
      !['quote', 'checkout', 'session'].includes(String(payload.action))) {
      return json({ error: 'Invalid request' }, 400)
    }
    if (payload.action === 'session') {
      return sessionStatus('sessionId' in payload ? payload.sessionId : undefined)
    }
    if (!('intent' in payload)) return json({ error: 'Invalid request' }, 400)
    const catalogue = await loadCatalogue()
    const quote = quoteCommerce(payload.intent, catalogue)
    if (!quote) return json({ error: 'Items unavailable or invalid' }, 422)
    if (payload.action === 'quote') return json(quote)
    if (quote.shipping.status !== 'quoted') return json({ error: 'Carrier quote required' }, 409)
    return await createCheckout(quote)
  } catch {
    return json({ error: 'Quote service unavailable' }, 503)
  }
})
