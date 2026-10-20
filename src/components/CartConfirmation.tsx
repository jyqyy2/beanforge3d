import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { checkoutConfigured } from '../utils/checkout'
import pumpkinImage from '../assets/halloween-pumpkin.png'
import ghostImage from '../assets/halloween-ghost.png'
import skullImage from '../assets/halloween-skull.png'
import spiderImage from '../assets/halloween-spider.png'
import catSideImage from '../assets/halloween-cat-side.png'
import catBackImage from '../assets/halloween-cat-back.png'
import './CartConfirmation.css'

const halloweenImages = {
  pumpkin: pumpkinImage,
  ghost: ghostImage,
  skull: skullImage,
  spider: spiderImage,
  'cat-side': catSideImage,
  'cat-back': catBackImage,
}

export default function CartConfirmation() {
  const { recentlyAdded, cartItems, storageFailed, dismissCartConfirmation } = useCart()
  const location = useLocation()
  const openedAt = useRef<string | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const checkoutAvailable = checkoutConfigured && !cartItems.some(item => item.halloweenConfiguration)

  useEffect(() => {
    if (!recentlyAdded) return
    closeButton.current?.focus()
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissCartConfirmation()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [recentlyAdded, dismissCartConfirmation])

  useEffect(() => {
    if (!recentlyAdded) { openedAt.current = location.key; return }
    if (openedAt.current !== location.key) dismissCartConfirmation()
  }, [location.key, recentlyAdded, dismissCartConfirmation])

  if (!recentlyAdded) return null

  const image = recentlyAdded.image ?? (recentlyAdded.halloweenConfiguration
    ? halloweenImages[recentlyAdded.halloweenConfiguration.slots[0]] : undefined)
  const detail = recentlyAdded.halloweenConfiguration
    ? `${recentlyAdded.halloweenConfiguration.layout.replace('x', ' × ')} · ${recentlyAdded.colour}${recentlyAdded.halloweenConfiguration.extras?.length ? ` · ${recentlyAdded.halloweenConfiguration.extras.length} extra keycaps` : ''}`
    : recentlyAdded.configuration
      ? `${recentlyAdded.configuration.characters.length} ${recentlyAdded.configuration.characters.length === 1 ? 'board' : 'boards'} · ${recentlyAdded.colour}`
      : `${recentlyAdded.standDesign ? `${recentlyAdded.standDesign} · ` : ''}${recentlyAdded.colour}`

  return <aside className="cart-confirmation-popover" role="dialog" aria-modal="false" aria-labelledby="cart-confirmation-title">
    <div className="cart-confirmation-heading">
      <h2 id="cart-confirmation-title">✓ Item added to your cart</h2>
      <button ref={closeButton} type="button" aria-label="Close cart confirmation" onClick={dismissCartConfirmation}>×</button>
    </div>
    <div className="cart-confirmation-product">
      {image ? <img src={image} alt="" /> : <span className="cart-confirmation-initial" aria-hidden="true">{recentlyAdded.configuration?.characters.map(character => character.character).join('') ?? '✦'}</span>}
      <div><strong>{recentlyAdded.name}</strong><p>{detail}</p><p>Quantity: {recentlyAdded.quantity}</p></div>
    </div>
    {storageFailed && <p role="alert">Your cart could not be saved in this browser. Keep this page open and retry.</p>}
    <div className="cart-confirmation-actions">
      <Link to="/cart" onClick={dismissCartConfirmation}>View cart ({cartCount})</Link>
      {checkoutAvailable ? <Link className="cart-confirmation-checkout" to="/cart" onClick={dismissCartConfirmation}>Review checkout</Link>
        : <button type="button" disabled>Checkout unavailable</button>}
      {!checkoutAvailable && <p>{cartItems.some(item => item.halloweenConfiguration) ? 'Halloween pricing is pending.' : 'Checkout is not configured yet.'}</p>}
      <button type="button" className="cart-confirmation-continue" onClick={dismissCartConfirmation}>Continue shopping</button>
    </div>
  </aside>
}
