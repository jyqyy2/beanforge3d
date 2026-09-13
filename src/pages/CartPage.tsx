import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import ResponsiveImage from '../components/ResponsiveImage'
import { cartItemIdentity } from '../utils/cartIdentity'
import KeycapPreview from '../components/KeycapPreview'

function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
  } = useCart()

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const cartTotal = cartSubtotal

  return (
    <main className="cart-page">
      <div className="cart-page-inner">
        <Link to="/" className="back-link">
          ← Back to shop
        </Link>

        <div className="cart-heading">
          <p className="eyebrow">YOUR CART</p>
          <h1>Shopping cart</h1>
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
                      alt={`${item.name} in ${item.colour}`}
                    />
                  )}

                  <div className="cart-item-info">
                    <h2><Link to={item.configuration ? `/studio/keycaps?edit=${encodeURIComponent(cartItemIdentity(item))}` : `/product/${item.productSlug}`}>{item.name}</Link></h2>
                    <p>{item.configuration ? 'Board colour' : 'Colour'}: {item.colour}</p>
                    {item.configuration && <>
                      <KeycapPreview configuration={item.configuration} compact />
                      <Link className="back-link" to={`/studio/keycaps?edit=${encodeURIComponent(cartItemIdentity(item))}`}>Edit design</Link>
                      <p>Illustrative preview · temporary development price.</p>
                    </>}
                    <p>S${item.price.toFixed(2)} each</p>

                    <div className="cart-quantity-controls">
                      <span>Quantity</span>

                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name} in ${item.colour}`}
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
                        aria-label={`Increase quantity of ${item.name} in ${item.colour}`}
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
                      S${(item.price * item.quantity).toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name} in ${item.colour}`}
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

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>S${cartSubtotal.toFixed(2)}</strong>
              </div>

              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <strong>S${cartTotal.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                className="checkout-button"
                disabled
              >
                Checkout coming soon
              </button>

              <p className="cart-summary-note">
                Shipping is not included. Checkout is not available yet.
              </p>
              <Link to="/#shop" className="back-link">Continue shopping →</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default CartPage
