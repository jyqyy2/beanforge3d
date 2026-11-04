import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyCheckoutSession } from '../utils/checkout'

function CheckoutResultPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState<'checking' | 'recorded' | 'processing' | 'unpaid' | 'unavailable'>('checking')

  useEffect(() => {
    if (!sessionId) return
    let active = true
    let timer: number | undefined
    let attempts = 0
    const check = () => {
      void verifyCheckoutSession(sessionId).then(result => {
        if (!active) return
        if (!result.paid || result.currency !== 'sgd') { setStatus('unpaid'); return }
        if (result.orderRecorded) { setStatus('recorded'); return }
        setStatus('processing')
        if (++attempts < 10) timer = window.setTimeout(check, 3000)
      }).catch(() => { if (active) setStatus('unavailable') })
    }
    check()
    return () => { active = false; window.clearTimeout(timer) }
  }, [sessionId])

  return <main className="cart-page">
    <div className="cart-page-inner">
      <p className="eyebrow">STRIPE TEST CHECKOUT</p>
      <h1>{status === 'recorded' ? 'Test order recorded' : status === 'processing' ? 'Recording your test order' : status === 'checking' && sessionId ? 'Checking payment status' : status === 'unpaid' ? 'Payment not confirmed' : 'Payment status unavailable'}</h1>
      <p role="status">{!sessionId || status === 'unavailable'
        ? 'We could not verify this test payment. Check Stripe before trying again.'
        : status === 'recorded'
          ? 'Stripe confirms this test payment and your order details are saved. Your cart remains in this browser.'
          : status === 'processing'
            ? 'Stripe confirms this test payment. We are waiting for your order record; do not pay again.'
          : status === 'unpaid'
            ? 'Stripe has not confirmed a payment for this session.'
            : 'Checking with Stripe…'}</p>
      <Link className="button button-dark" to="/">Back to shop</Link>
    </div>
  </main>
}

export default CheckoutResultPage
