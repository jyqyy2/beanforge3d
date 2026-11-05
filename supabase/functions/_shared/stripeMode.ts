export type StripeMode = 'test' | 'live'

export function stripeMode(value: string | undefined): StripeMode | null {
  return value === undefined || value === 'test' ? 'test' : value === 'live' ? 'live' : null
}

export function validStripeKey(mode: StripeMode | null, key: string | undefined): boolean {
  return mode !== null && typeof key === 'string' && key.startsWith(mode === 'live' ? 'sk_live_' : 'sk_test_')
}

export function validSessionId(mode: StripeMode | null, id: unknown): id is string {
  return mode !== null && typeof id === 'string' && new RegExp('^cs_' + mode + '_[A-Za-z0-9_]{10,}$').test(id)
}

export function matchesStripeMode(mode: StripeMode | null, value: unknown): boolean {
  return mode !== null && value === (mode === 'live')
}
