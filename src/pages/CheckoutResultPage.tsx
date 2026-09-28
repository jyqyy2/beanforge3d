import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyCheckoutSession } from '../utils/checkout'

function CheckoutResultPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState<'checking' | 'paid' | 'unpaid' | 'unavailable'>('checking')

  useEffect(() => {
    if (!sessionId) return
    let active = true
    void verifyCheckoutSession(sessionId).then(result => {
      if (active) setStatus(result.paid && result.currency === 'sgd' ? 'paid' : 'unpaid')
    }).catch(() => {
      if (active) setStatus('unavailable')
    })
    return () => { active = false }
  }, [sessionId])

  return <main className="cart-page">
    <div className="cart-page-inner">
      <p className="eyebrow">STRIPE TEST CHECKOUT</p>
      <h1>{status === 'paid' ? 'Test payment confirmed' : status === 'checking' && sessionId ? 'Checking payment status' : 'Payment status unavailable'}</h1>
      <p role="status">{!sessionId || status === 'unavailable'
        ? 'We could not verify this test payment. Check Stripe before trying again.'
        : status === 'paid'
          ? 'Stripe confirms this test payment. Your cart is still saved; this test checkout does not create an order.'
          : status === 'unpaid'
            ? 'Stripe has not confirmed a payment for this session.'
            : 'Checking with Stripe…'}</p>
      <Link className="button button-dark" to="/">Back to shop</Link>
    </div>
  </main>
}

export default CheckoutResultPage
