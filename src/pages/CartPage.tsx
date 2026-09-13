import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'

function CartPage() {
  const { cartItems, removeFromCart } = useCart()

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
          <section className="cart-items">
            {cartItems.map((item, index) => (
              <article
                className="cart-item"
                key={`${item.productSlug}-${item.colour}-${index}`}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={`${item.name} in ${item.colour}`}
                  />
                )}

                <div className="cart-item-info">
                  <h2>{item.name}</h2>
                  <p>Colour: {item.colour}</p>
                  <p>Quantity: {item.quantity}</p>
                </div>

                <div className="cart-item-actions">
                  <strong>
                    S${(item.price * item.quantity).toFixed(2)}
                  </strong>

                  <button
                    type="button"
                    onClick={() => removeFromCart(index)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default CartPage
