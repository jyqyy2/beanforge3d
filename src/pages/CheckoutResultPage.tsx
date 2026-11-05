import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyCheckoutSession } from '../utils/checkout'
import './CheckoutResultPage.css'

function CheckoutResultPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState<'checking' | 'recorded' | 'processing' | 'unpaid' | 'unavailable'>('checking')
  const [liveMode, setLiveMode] = useState<boolean | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let active = true
    let timer: number | undefined
    let attempts = 0
    const check = () => {
      void verifyCheckoutSession(sessionId).then(result => {
        if (!active) return
        setLiveMode(result.livemode)
        if (!result.paid || result.currency !== 'sgd') { setStatus('unpaid'); return }
        if (result.orderRecorded) { setStatus('recorded'); return }
        setStatus('processing')
        if (++attempts < 10) timer = window.setTimeout(check, 3000)
      }).catch(() => { if (active) setStatus('unavailable') })
    }
    check()
    return () => { active = false; window.clearTimeout(timer) }
  }, [sessionId])

  return <main className="cart-page checkout-result">
    <div className="cart-page-inner checkout-result-inner">
      <p className="eyebrow">{liveMode === false ? 'TEST ORDER STATUS' : 'ORDER STATUS'}</p>
      <h1>{status === 'recorded' ? 'Your order is confirmed.' : status === 'processing' ? 'Payment received. Saving your order.' : status === 'checking' && sessionId ? 'Checking your payment.' : status === 'unpaid' ? 'Payment not confirmed.' : 'We cannot verify this payment yet.'}</h1>
      <p role="status">{!sessionId || status === 'unavailable'
        ? 'Please do not pay again until you have checked your payment status. Contact us if you need help.'
        : status === 'recorded'
          ? (liveMode ? 'Payment and order details are recorded. Your cart remains in this browser.' : 'Your test payment and order details are recorded. Your cart remains in this browser.')
          : status === 'processing'
            ? 'Your payment is confirmed. We are waiting for the order record; please do not pay again.'
          : status === 'unpaid'
            ? 'No payment has been confirmed for this checkout session. Your cart is still available.'
            : 'This may take a moment. Please keep this page open.'}</p>
      <div className="checkout-result-actions">
        <Link className="button button-dark" to="/shop">Continue shopping</Link>
        <Link className="back-link" to="/cart">View cart</Link>
      </div>
    </div>
  </main>
}

export default CheckoutResultPage
