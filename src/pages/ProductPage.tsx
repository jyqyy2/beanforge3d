/*users picks colour, react doesn't rmb. this line gives
React a tiny memory called state
Can use that information later for the image, cart, customization, etc*/
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductBySlug } from '../data/catalogue'
import type { CartItem } from '../types/cart'
import { useCart } from '../context/useCart'
import ResponsiveImage from '../components/ResponsiveImage'
import StandStudioPage from './StandStudioPage'

function ProductPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  if (product?.slug === 'qr-nfc-stand' && product.standDesigns?.length) return <StandStudioPage product={product} />
  return <ProductDetails key={slug} slug={slug} />
}

function ProductDetails({ slug }: { slug: string | undefined }) {
  const { addToCart } = useCart()

  const product = getProductBySlug(slug)
  /*selectedColour = what colour React remembers
    setSelectedColour = the button/function we use to change that memory
    useState(...) = React's little memory system

    product?.colours[0] ?? '' simply means
    “Start with the product's first available colour.
    If there isn't one, start with an empty string.”
   */
  const [selectedColour, setSelectedColour] = useState(
    product?.colours[0] ?? ''
  )

  /*14a*/
  const [quantity, setQuantity] = useState(1)
  const [addedToCartMessage, setAddedToCartMessage] = useState('')

  if (!product) {
    return (
      <main className="product-page">
        <div className="product-page-inner">
          <Link to="/" className="back-link">
            ← Back to shop
          </Link>

          <h1>Product not found</h1>

          <p>
            Sorry, we couldn't find that product.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="product-page">
      <div className="product-page-inner">

        <Link to="/" className="back-link">
          ← Back to shop
        </Link>

        <div className="product-detail">

          <div className="product-detail-image">
            {product.image && (
                <ResponsiveImage
                    sizes="(max-width: 600px) 86vw, (max-width: 850px) 560px, 500px"
                    fetchPriority="high"
                /* #59 Step 8 
                    Bean Keycap
                        ↓
                        selectedColour = Pink
                        ↓
                        alt = "Bean Keycap in Pink"
                */
               
               /*If this colour has its own image, use it. Otherwise, use the normal product image.*/
                    src={product.colourImages?.[selectedColour] ?? product.image}
                    alt={`${product.name} in ${selectedColour}`}
                    />
            )}
            </div>

          <div className="product-detail-info">

            <p className="eyebrow">
              {product.category}
            </p>

            <h1>{product.name}</h1>

            <p className="product-price">
              S${product.price.toFixed(2)}
            </p>

            <p className="product-description">
              {product.description}
            </p>

            <div className="product-option">
                <label htmlFor="colour">
                    Colour: {selectedColour}
                </label>

            {/* #59 dropdown connected to React state
            value={selectedColour} 
            says: “Dropdown, show the colour React currently remembers.”
            and
            onChange={(event) => setSelectedColour(event.target.value)}
            says: “When the customer chooses a new colour, tell React to remember it.”
            
            <select
                id="colour"
                value={selectedColour}
                onChange={(event) => setSelectedColour(event.target.value)}
                >
                {product.colours.map((colour) => (
                    <option key={colour} value={colour}>
                    {colour}
                    </option>
                ))}
            </select>
            */}

            {/* Top #59 code replaced with bottom code *
            {product.colours.map((colour) => ( means “For every colour this product has, make a button.”
            And selectedColour === colour means “Is this the colour the user has selected?”
            If yes, we give it the extra CSS class
            onClick={() => setSelectedColour(colour)} means to rmb the colour when the user clicks */}
            <div className="colour-options">
                {product.colours.map((colour) => ( 
                    <button
                    key={colour}
                    type="button"
                    className={
                        selectedColour === colour
                        ? 'colour-button selected'
                        : 'colour-button'
                    }
                    aria-pressed={selectedColour === colour}
                    onClick={() => {
                      setSelectedColour(colour)
                      setAddedToCartMessage('')
                    }}
                    >
                    {colour}
                    </button>
                ))}
            </div>

            {/*for React to put the value he's remembering into {selectedColour} - not static
            So Customer click → React receives it → React remembers it → Page displays it
            <p>Selected colour: {selectedColour}</p>*/}
            
            {/*give it a class so we can control its size.
            But eventually deleted this portion...
                <p className="selected-colour-text">
                    Selected colour: {selectedColour}
                </p>

            cause i added #59-step-11
                <label htmlFor="colour">
                    Colour: {selectedColour}
                </label>
            */}

            </div>

            <div className="quantity-option">
            <label>Quantity</label>
              <div className="quantity-controls">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity === 1}
                  onClick={() =>
                    setQuantity((currentQuantity) =>
                      /*quantity cannot go below 1*/
                      Math.max(1, currentQuantity - 1)
                    )
                  }
                >
                  −
                </button>

                {/*puts our remembered number onto the screen. */}
                <span>{quantity}</span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQuantity((currentQuantity) =>
                      currentQuantity + 1
                    )
                  }
                >
                  +
                </button>
              </div>
          </div>

            <button
              type="button"
              className="add-to-cart-button"
              onClick={() => {
                const cartItem: CartItem = {
                  productSlug: product.slug,
                  name: product.name,
                  price: product.price,
                  colour: selectedColour,
                  quantity,
                  image: product.colourImages?.[selectedColour] ?? product.image,
                }

                addToCart(cartItem)
                setAddedToCartMessage(`${quantity} × ${product.name} in ${selectedColour} added to your cart.`)
              }}
            >
              Add to cart
          </button>

            <div className="cart-confirmation" role="status" aria-live="polite" aria-atomic="true">
              {addedToCartMessage && (
                <p>{addedToCartMessage} <Link to="/cart">View cart →</Link></p>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}

export default ProductPage
