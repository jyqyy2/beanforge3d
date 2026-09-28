import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/useCart'
import ResponsiveImage from '../components/ResponsiveImage'
import { cartItemIdentity } from '../utils/cartIdentity'
import KeycapPreview from '../components/KeycapPreview'
import { checkoutConfigured, requestQuote, startCheckout } from '../utils/checkout'
import type { ServerQuote } from '../utils/checkout'
import type { CartItem } from '../types/cart'

function CartPage() {
  const location = useLocation()
  const {
    cartItems,
    storageFailed,
    removeFromCart,
    updateCartItemQuantity,
  } = useCart()
  const [country, setCountry] = useState<'SG' | 'MY'>('SG')
  const [quoteState, setQuoteState] = useState<{ items: CartItem[]; country: 'SG' | 'MY'; quote: ServerQuote } | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const serverQuote = quoteState?.items === cartItems && quoteState.country === country ? quoteState.quote : null

  useEffect(() => {
    if (!checkoutConfigured || cartItems.length === 0) return
    const controller = new AbortController()
    void requestQuote(cartItems, country, controller.signal).then(quote => {
      if (controller.signal.aborted) return
      setQuoteState({ items: cartItems, country, quote })
      setQuoteError('')
    }).catch(error => {
      if (controller.signal.aborted) return
      setQuoteState(null)
      setQuoteError(error instanceof Error ? error.message : 'Quote unavailable.')
    })
    return () => controller.abort()
  }, [cartItems, country])

  async function handleCheckout() {
    if (!serverQuote || serverQuote.shipping.status !== 'quoted' || checkoutBusy) return
    setCheckoutBusy(true)
    try {
      const checkout = await startCheckout(cartItems)
      if (checkout.quote.payableTotalMinor !== serverQuote.payableTotalMinor ||
        checkout.quote.lines.some((line, index) =>
          line.unitAmountMinor !== serverQuote.lines[index]?.unitAmountMinor ||
          line.lineAmountMinor !== serverQuote.lines[index]?.lineAmountMinor)) {
        setQuoteState({ items: cartItems, country, quote: checkout.quote })
        setQuoteError('Prices changed. Please review the new total before continuing.')
        setCheckoutBusy(false)
        return
      }
      window.location.assign(checkout.url)
    } catch (error) {
      setQuoteError(error instanceof Error ? error.message : 'Checkout unavailable.')
      setCheckoutBusy(false)
    }
  }

  return (
    <main className="cart-page">
      <div className="cart-page-inner">
        <Link to="/" className="back-link">
          ← Back to shop
        </Link>

        <div className="cart-heading">
          <p className="eyebrow">YOUR CART</p>
          <h1>Shopping cart</h1>
          {storageFailed && <p role="alert">Your latest cart changes could not be saved on this browser. Keep this page open: refreshing or leaving may lose these changes.</p>}
          {location.state?.designSaved === true && <p role="status">Design saved. Matching designs are combined and quantities preserved.</p>}
        </div>

        {cartItems.length === 0 ? (
          <section className="empty-cart">
            <h2>Your cart is empty.</h2>
            <p>
              Add a small thing you love, then it will appear here.
            </p>
            <Link to="/#shop" className="button button-dark">
              Browse products
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {cartItems.map((item, index) => (
                <article
                  className={item.configuration ? 'cart-item cart-item-custom' : 'cart-item'}
                  key={cartItemIdentity(item)}
                >
                  {item.image && (
                    <ResponsiveImage
                      sizes="(max-width: 650px) 88px, 120px"
                      loading="lazy"
                      src={item.image}
                      alt={item.standDesign ? `${item.standDesign} stand reference photograph` : `${item.name} in ${item.colour}`}
                    />
                  )}

                  <div className="cart-item-info">
                    <h2><Link to={item.configuration ? `/studio/keycaps?edit=${encodeURIComponent(cartItemIdentity(item))}` : `/product/${item.productSlug}`}>{item.name}</Link></h2>
                    <p>{item.configuration ? 'Board colour' : 'Colour'}: {item.colour}</p>
                    {item.standDesign && <p>Stand: {item.standDesign}</p>}
                    {item.configuration && <>
                      <KeycapPreview configuration={item.configuration} compact />
                      <Link className="back-link" to={`/studio/keycaps?edit=${encodeURIComponent(cartItemIdentity(item))}`}>Edit design</Link>
                      <p>Illustrative preview · temporary development price.</p>
                    </>}
                    <p>{serverQuote?.lines[index] ? `S$${(serverQuote.lines[index].unitAmountMinor / 100).toFixed(2)} each` : 'Price pending'}</p>

                    <div className="cart-quantity-controls">
                      <span>Quantity</span>

                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}${item.standDesign ? ` · ${item.standDesign}` : ''} in ${item.colour}`}
                        disabled={item.quantity === 1}
                        onClick={() =>
                          updateCartItemQuantity(
                            index,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <strong>{item.quantity}</strong>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}${item.standDesign ? ` · ${item.standDesign}` : ''} in ${item.colour}`}
                        onClick={() =>
                          updateCartItemQuantity(
                            index,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <strong>
                      {serverQuote?.lines[index] ? `S$${(serverQuote.lines[index].lineAmountMinor / 100).toFixed(2)}` : '—'}
                    </strong>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name}${item.standDesign ? ` · ${item.standDesign}` : ''} in ${item.colour}`}
                      onClick={() => removeFromCart(index)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Order summary</h2>
              <label htmlFor="shipping-country">Deliver to</label>
              <select id="shipping-country" value={country} onChange={event => {
                setCountry(event.target.value as 'SG' | 'MY')
              }}>
                <option value="SG">Singapore</option>
                <option value="MY">Malaysia</option>
              </select>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>{serverQuote ? `S$${(serverQuote.merchandiseSubtotalMinor / 100).toFixed(2)}` : '—'}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <strong>{serverQuote?.shipping.status === 'quoted'
                  ? `S$${(serverQuote.shipping.amountMinor / 100).toFixed(2)}`
                  : serverQuote?.shipping.status === 'requires_carrier_quote' ? 'Carrier quote required' : '—'}</strong>
              </div>

              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <strong>{serverQuote?.payableTotalMinor !== null && serverQuote?.payableTotalMinor !== undefined
                  ? `S$${(serverQuote.payableTotalMinor / 100).toFixed(2)}` : '—'}</strong>
              </div>

              <button
                type="button"
                className="checkout-button"
                disabled={!serverQuote || serverQuote.shipping.status !== 'quoted' || checkoutBusy || storageFailed}
                onClick={() => void handleCheckout()}
              >
                {checkoutBusy ? 'Opening secure checkout…' : 'Pay securely with Stripe'}
              </button>

              <p className="cart-summary-note">Stripe test checkout. No live payments are accepted.</p>
              {!checkoutConfigured && <p role="status">Checkout has not been configured yet.</p>}
              {quoteError && <p role="alert">{quoteError}</p>}
              {serverQuote?.shipping.status === 'requires_carrier_quote' &&
                <p role="status">Malaysia checkout will be available after carrier rates are connected.</p>}
              <Link to="/#shop" className="back-link">Continue shopping →</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default CartPage
