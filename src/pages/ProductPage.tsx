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
import { normalisePersonalisation } from '../utils/personalisation'
import { nameKeychainPriceMinor } from '../utils/namePricing'

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
  const [personalisation, setPersonalisation] = useState('')

  if (!product) {
    return (
      <main className="product-page">
        <div className="product-page-inner">
          <Link to="/shop" className="back-link">
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

  const isPlate = product.slug === 'custom-carplate-keychain'
  const isName = product.slug === 'custom-name-keychain'
  const customText = isPlate || isName ? normalisePersonalisation(product.slug, personalisation) : null
  const namePriceMinor = isName && customText ? nameKeychainPriceMinor(customText.length) : null
  const unitPrice = namePriceMinor === null ? product.price : namePriceMinor / 100

  return (
    <main className="product-page">
      <div className="product-page-inner">

        <Link to="/shop" className="back-link">
          ← Back to shop
        </Link>

        <div className="product-detail">

          <div className="product-detail-image">
            {product.image && (
                <ResponsiveImage
                    sizes="(max-width: 600px) 86vw, (max-width: 850px) 560px, 500px"
                    fetchPriority="high"
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
              {product.priceDisplay === 'from' && !customText ? 'From ' : ''}S${unitPrice.toFixed(2)}
            </p>

            <p className="product-description">
              {product.description}
            </p>

            {(isPlate || isName) && <div className="product-option personalisation-option">
              <label htmlFor="personalisation">{isPlate ? 'Your plate text' : 'Your name (1–10 letters)'}</label>
              <input id="personalisation" type="text" value={personalisation}
                maxLength={isPlate ? 16 : 10}
                placeholder={isPlate ? 'e.g. SMX 6769 L' : 'Enter your name'}
                onChange={event => setPersonalisation(event.target.value.toUpperCase())}
                aria-describedby="personalisation-hint" />
              <p id="personalisation-hint">{isPlate
                ? 'Up to 16 letters, numbers and spaces. Product photos show an example plate, not your finished design.'
                : 'Letters only. S$6.90 for one letter, then S$1.00 for each additional letter (up to 10).'}</p>
              {customText && <p className="personalisation-preview">Your text: <strong>{customText}</strong></p>}
              {namePriceMinor !== null && <p role="status">{customText?.length} {customText?.length === 1 ? 'letter' : 'letters'} · S${unitPrice.toFixed(2)} each</p>}
            </div>}

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
              disabled={(isPlate || isName) && !customText}
              onClick={() => {
                const cartItem: CartItem = {
                  productSlug: product.slug,
                  name: product.name,
                  price: unitPrice,
                  colour: selectedColour,
                  ...((isPlate || isName) && customText ? { personalisation: customText } : {}),
                  quantity,
                  image: product.colourImages?.[selectedColour] ?? product.image,
                }

                addToCart(cartItem)
              }}
            >
              Add to cart
          </button>

          </div>

        </div>
      </div>
    </main>
  )
}

export default ProductPage
