import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { useCart } from '../context/useCart'
import chickPreview from '../assets/qr-chick-preview.png'
import beePreview from '../assets/qr-bee-preview.png'
import { readStandDraft, saveStandDraft } from '../utils/standDraft'
import './KeycapStudioPage.css'
import './KeycapColours.css'
import './StandStudioPage.css'

export default function StandStudioPage({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const designs = product.standDesigns ?? []
  const [initialDraft] = useState(() => readStandDraft(product))
  const [draftAllowed, setDraftAllowed] = useState(initialDraft.status === 'ready')
  const [designName, setDesignName] = useState(initialDraft.draft?.design ?? designs[0]?.name)
  const [colour, setColour] = useState(initialDraft.draft?.colour ?? product.colours[0] ?? '')
  const [quantity, setQuantity] = useState(initialDraft.draft?.quantity ?? 1)
  const [saveResult, setSaveResult] = useState<{ snapshot: string; saved: boolean } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const resetButton = useRef<HTMLButtonElement>(null)
  const snapshot = JSON.stringify([designName, colour, quantity])
  useEffect(() => {
    if (!draftAllowed || !designName) return
    const timer = window.setTimeout(() => {
      setSaveResult({ snapshot, saved: saveStandDraft({ design: designName, colour, quantity }, product) })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [draftAllowed, designName, colour, quantity, product, snapshot])
  const [message, setMessage] = useState('')
  const design = designs.find((option) => option.name === designName)
  const total = product.price * quantity
  const valid = !!design && product.colours.includes(colour) && Number.isFinite(total) && total >= 0
  const money = (amount: number) => `S$${amount.toFixed(2)}`
  const previewImage = (name: string) => name === 'Bee' ? beePreview : chickPreview

  return <main className="keycap-studio stand-studio">
    <Link to="/#shop" className="back-link">← Back to the shop</Link>
    <header className="studio-heading">
      <p className="eyebrow">THE BEANFORGE QR / NFC STUDIO</p>
      <h1>Build your stand.</h1>
      <p>A little stand for your business.</p>
    </header>
    <div className="studio-layout">
      <section className="studio-draft-toolbar" aria-label="Stand draft">
        <p role="status">{!draftAllowed ? 'Your saved draft could not be restored. We have kept it untouched.' : saveResult?.snapshot !== snapshot ? 'Saving draft…' : saveResult.saved ? 'Draft saved' : 'Draft not saved. Keep this page open to avoid losing changes.'}</p>
        <div className="studio-choices">
          {!draftAllowed && <button type="button" onClick={() => window.location.reload()}>Reload and retry</button>}
          <button ref={resetButton} type="button" disabled={initialDraft.status === 'read-failed'} aria-expanded={confirmReset} aria-controls="stand-reset" onClick={() => setConfirmReset(true)}>Start new design</button>
        </div>
        {confirmReset && <div id="stand-reset" role="group" aria-labelledby="stand-reset-title">
          <p id="stand-reset-title"><strong>Start a new design?</strong></p>
          <p className="studio-note">Your current draft will be reset, including stand, colour and quantity. Saved cart designs won't be affected.</p>
          <div className="studio-choices">
            <button type="button" autoFocus onClick={() => { setConfirmReset(false); resetButton.current?.focus() }}>Keep my design</button>
            <button type="button" onClick={() => {
              const defaultDesign = designs[0]?.name
              if (!defaultDesign) return
              const defaults = { design: defaultDesign, colour: product.colours[0] ?? '', quantity: 1 }
              if (!saveStandDraft(defaults, product)) { setMessage('Your draft could not be reset safely. Please keep this page open.'); return }
              setDesignName(defaults.design); setColour(defaults.colour); setQuantity(1)
              setDraftAllowed(true); setConfirmReset(false); setMessage(''); resetButton.current?.focus()
            }}>Start new design</button>
          </div>
        </div>}
      </section>
      <section className="keycap-preview" aria-label="Stand preview">
        <p className="eyebrow">YOUR LIVE PREVIEW</p>
        <div className="stand-preview-stage">{design && <img className="stand-photograph" src={previewImage(design.name)} fetchPriority="high" alt={`${design.name} QR / NFC stand with QR panel and white base`} />}</div>
        <div className="stand-preview-dots" role="group" aria-label="Preview stand">
          {designs.map(option => <button key={option.name} type="button" aria-label={`Preview ${option.name}`} aria-pressed={designName === option.name} onClick={() => { setDesignName(option.name); setMessage('') }}><span /></button>)}
        </div>
        <p className="studio-note" role="status">{designName} · {colour}</p>
        <p className="studio-note">Preview shows the original design colours, not your selected colour.</p>
      </section>
      <section className="studio-options" aria-label="Configure your stand">
        <fieldset>
          <legend>Choose your stand.</legend>
          <p className="studio-note">Pick a little character for your counter.</p>
          <div className="studio-choices stand-design-cards">{designs.map((option) => <button type="button" key={option.name} aria-pressed={designName === option.name} onClick={() => { setDesignName(option.name); setMessage('') }}><img src={previewImage(option.name)} alt="" /><span>{option.name}</span>{designName === option.name && <span className="stand-selected" aria-hidden="true">✓</span>}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Choose your colour.</legend>
          <p className="studio-note">Choose from the available stand colours.</p>
          <div className="studio-choices">{product.colours.map((option) => <button type="button" key={option} aria-pressed={colour === option} onClick={() => { setColour(option); setMessage('') }}><span className="studio-swatch" data-colour={option} aria-hidden="true" />{option}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Quantity</legend>
          <div className="studio-choices stand-quantity">
            <button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => { setQuantity(quantity - 1); setMessage('') }}>−</button>
            <output aria-label="Quantity">{quantity}</output>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= Number.MAX_SAFE_INTEGER} onClick={() => { setQuantity(quantity + 1); setMessage('') }}>+</button>
          </div>
        </fieldset>
      </section>
      <section className="studio-purchase" aria-label="Your stand price">
        <div>
          <p className="eyebrow">YOUR STAND</p>
          <h2>{designName}</h2>
          <p className="studio-note">{product.name}</p>
          <p className="studio-note">{colour} · Quantity: {quantity}</p>
        </div>
        <div className="studio-price-action">
          <dl>
            <div><dt>Stand · each</dt><dd>{money(product.price)}</dd></div>
            <div><dt>Quantity</dt><dd>{quantity}</dd></div>
            <div className="studio-total"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          <button type="button" className="studio-add" disabled={!valid} onClick={() => {
            if (!valid || !design) return
            addToCart({ productSlug: product.slug, name: product.name, price: product.price, colour, quantity, standDesign: design.name, image: design.image })
            setMessage(`${quantity} × ${design.name} stand in ${colour} added to your cart.`)
          }}>Add my stand to cart</button>
          <p className="studio-note">Your cart saves a copy of this stand. Checkout is not available yet.</p>
          <p role="status" className="studio-action-message">{message}</p>
          {message && <Link to="/cart" className="back-link">View cart →</Link>}
        </div>
      </section>
    </div>
  </main>
}
