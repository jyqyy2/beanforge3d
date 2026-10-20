import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { halloweenKeycaps, type HalloweenConfiguration } from '../types/halloween'
import pumpkinImage from '../assets/halloween-pumpkin.png'
import ghostImage from '../assets/halloween-ghost.png'
import skullImage from '../assets/halloween-skull.png'
import spiderImage from '../assets/halloween-spider.png'
import catSideImage from '../assets/halloween-cat-side.png'
import catBackImage from '../assets/halloween-cat-back.png'
import './HalloweenStudioPage.css'

type LayoutId = '1x1' | '2x1' | '2x2' | '4x1'
type BoardColour = 'Cream' | 'Pink' | 'Black' | 'Purple' | 'White' | 'Turquoise'
type KeycapId = 'pumpkin' | 'ghost' | 'skull' | 'spider' | 'cat-side' | 'cat-back'

type HalloweenDraft = {
  version: 1
  layout: LayoutId
  boardColour: BoardColour
  slots: Array<KeycapId | null>
  extras?: Array<KeycapId | null>
}

type HalloweenKeycap = {
  id: KeycapId
  name: string
  colour: 'purple' | 'orange' | 'cream'
  image: string
  description: string
}

const draftKey = 'beanforge-halloween-clicker-draft'
const boardColours: BoardColour[] = ['Cream', 'Pink', 'Black', 'Purple', 'White', 'Turquoise']
const layouts: Array<{ id: LayoutId; label: string; slots: number; className: string }> = [
  { id: '1x1', label: '1 × 1', slots: 1, className: 'layout-one' },
  { id: '2x1', label: '2 × 1', slots: 2, className: 'layout-two' },
  { id: '2x2', label: '2 × 2', slots: 4, className: 'layout-four layout-square' },
  { id: '4x1', label: '4 × 1', slots: 4, className: 'layout-four layout-tall' },
]

const keycaps: HalloweenKeycap[] = [
  { id: 'pumpkin', name: 'Pumpkin', colour: 'purple', image: pumpkinImage, description: 'A friendly jack-o’-lantern face.' },
  { id: 'ghost', name: 'Ghost', colour: 'purple', image: ghostImage, description: 'A little haunting, a lot of charm.' },
  { id: 'skull', name: 'Skull', colour: 'purple', image: skullImage, description: 'A classic Halloween favourite.' },
  { id: 'spider', name: 'Spider', colour: 'orange', image: spiderImage, description: 'A tiny creepy-crawly companion.' },
  { id: 'cat-side', name: 'Cat side', colour: 'orange', image: catSideImage, description: 'A curious cat on the prowl.' },
  { id: 'cat-back', name: 'Cat back', colour: 'cream', image: catBackImage, description: 'The quiet side of a familiar friend.' },
]

function readDraft(): HalloweenDraft {
  const fallback: HalloweenDraft = { version: 1, layout: '1x1', boardColour: 'Cream', slots: [null] }
  try {
    const parsed = JSON.parse(localStorage.getItem(draftKey) ?? 'null') as Partial<HalloweenDraft> | null
    if (!parsed || parsed.version !== 1 || !layouts.some(layout => layout.id === parsed.layout) ||
      !boardColours.includes(parsed.boardColour as BoardColour) || !Array.isArray(parsed.slots)) return fallback
    const layout = layouts.find(option => option.id === parsed.layout) ?? layouts[0]
    const slots = parsed.slots.slice(0, layout.slots).map(slot => keycaps.some(keycap => keycap.id === slot) ? slot : null)
    const extras = Array.isArray(parsed.extras) && parsed.extras.length <= 20
      ? parsed.extras.filter((extra): extra is KeycapId => halloweenKeycaps.includes(extra as KeycapId)) : []
    return { version: 1, layout: layout.id, boardColour: parsed.boardColour as BoardColour, slots: [...slots, ...Array(layout.slots - slots.length).fill(null)], extras }
  } catch {
    return fallback
  }
}

function HalloweenStudioPage() {
  const { addToCart, storageFailed } = useCart()
  const [draft, setDraft] = useState<HalloweenDraft>(() => readDraft())
  const [activeSlot, setActiveSlot] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)

  const layout = layouts.find(option => option.id === draft.layout) ?? layouts[0]
  const selectedKeycaps = useMemo(() => draft.slots.filter((slot): slot is KeycapId => slot !== null), [draft.slots])
  const selectedNames = selectedKeycaps.map(id => keycaps.find(keycap => keycap.id === id)?.name ?? '').filter(Boolean)
  const extras = draft.extras ?? []

  function updateExtraQuantity(keycap: KeycapId, change: -1 | 1) {
    setDraft(current => {
      const selected = (current.extras ?? []).filter((extra): extra is KeycapId => extra !== null)
      if (change === 1 && selected.length >= 20) return current
      if (change === -1 && !selected.includes(keycap)) return current
      const next = change === 1 ? [...selected, keycap] : selected.filter((extra, index) => extra !== keycap || index !== selected.indexOf(keycap))
      return { ...current, extras: halloweenKeycaps.flatMap(id => next.filter(extra => extra === id)) }
    })
  }

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {
      // Keep the draft in current page state if storage is unavailable.
    }
  }, [draft])

  function updateLayout(nextLayout: LayoutId) {
    const next = layouts.find(option => option.id === nextLayout) ?? layouts[0]
    setDraft(current => ({ ...current, layout: next.id, slots: current.slots.slice(0, next.slots).concat(Array(Math.max(0, next.slots - current.slots.length)).fill(null)) }))
    setActiveSlot(0)
  }

  function chooseKeycap(keycap: KeycapId) {
    setDraft(current => {
      const slots = [...current.slots]
      slots[activeSlot] = keycap
      return { ...current, slots }
    })
    setActiveSlot(current => {
      const nextEmpty = draft.slots.findIndex((slot, index) => index > current && slot === null)
      return nextEmpty >= 0 ? nextEmpty : current
    })
  }

  function resetDraft() {
    setDraft({ version: 1, layout: '1x1', boardColour: 'Cream', slots: [null] })
    setActiveSlot(0)
    setConfirmReset(false)
  }

  function addCreation() {
    if (draft.slots.some(slot => slot === null)) return
    const design = { ...draft, slots: [...draft.slots], extras: [...extras] } as HalloweenConfiguration
    addToCart({ productSlug: 'halloween-clicker', name: 'Halloween Fidget Clicker', price: 0,
      colour: design.boardColour, quantity: 1, halloweenConfiguration: design })
  }

  return (
    <main className="keycap-studio halloween-studio" data-colour={draft.boardColour}>
      <Link to="/studio" className="back-link">← Back to the studio</Link>
      <header className="studio-heading halloween-heading">
        <p className="eyebrow">THE BEANFORGE HALLOWEEN STUDIO</p>
        <h1>Build your little<br />mischief.</h1>
        <p>Choose a board, pick your Halloween keycaps, and make a clicker that feels like yours.</p>
      </header>

      <div className="studio-layout halloween-layout">
        <section className="halloween-draft-toolbar studio-draft-toolbar" aria-label="Halloween studio draft">
          <p role="status">Draft saved</p>
          <button type="button" onClick={() => setConfirmReset(true)}>Start new design</button>
          {confirmReset && <div className="halloween-reset" role="group" aria-label="Start a new Halloween design">
            <p><strong>Start a new design?</strong></p>
            <p>Your current Halloween clicker draft will be reset.</p>
            <button type="button" onClick={() => setConfirmReset(false)}>Keep my design</button>
            <button type="button" onClick={resetDraft}>Start new design</button>
          </div>}
        </section>

        <div className="halloween-workspace">
          <section className="halloween-preview keycap-preview" aria-label="Halloween clicker live preview">
          <p className="eyebrow">YOUR LIVE PREVIEW</p>
          <div className={`halloween-board ${layout.className} board-${draft.boardColour.toLowerCase()}`}>
            <span className="halloween-board-handle" aria-hidden="true" />
            {draft.slots.map((slot, index) => {
              const keycap = keycaps.find(option => option.id === slot)
              return <button type="button" className={`halloween-slot ${activeSlot === index ? 'is-active' : ''}`} key={index} aria-label={`Board ${index + 1}${keycap ? `, ${keycap.name}` : ', empty'}`} onClick={() => setActiveSlot(index)}>
                {keycap ? <img className="halloween-slot-image" src={keycap.image} alt="" /> : <span className="halloween-slot-empty">+</span>}
                <small>{index + 1}</small>
              </button>
            })}
          </div>
          <div className="preview-summary" aria-hidden="true">
            <span>{layout.label}</span>
            <span><span className="studio-swatch" data-colour={draft.boardColour} />{draft.boardColour}</span>
          </div>
          <p className="halloween-preview-note">{selectedNames.length ? selectedNames.join(' · ') : 'Select a board, then choose a keycap below.'}</p>
          </section>

          <section className="studio-options halloween-options" aria-label="Build your Halloween clicker">
          <div className="halloween-step">
          <fieldset>
            <legend><span className="halloween-step-label" aria-hidden="true">STEP 1</span>How many boards</legend>
            <p className="studio-note">Choose the shape of your clicker.</p>
            <div className="halloween-layout-choices">
              {layouts.map(option => <button type="button" key={option.id} aria-pressed={draft.layout === option.id} onClick={() => updateLayout(option.id)}><strong>{option.label}</strong><span>{option.slots} {option.slots === 1 ? 'board' : 'boards'}</span></button>)}
            </div>
          </fieldset>
          </div>

          <div className="halloween-step">
          <fieldset>
            <legend><span className="halloween-step-label" aria-hidden="true">STEP 2</span>Board colour</legend>
            <p className="studio-note">The colour of your whole clicker board.</p>
            <div className="studio-choices halloween-colours">
              {boardColours.map(colour => <button type="button" key={colour} aria-pressed={draft.boardColour === colour} onClick={() => setDraft(current => ({ ...current, boardColour: colour }))}><span className="studio-swatch" data-colour={colour} />{colour}</button>)}
            </div>
          </fieldset>
          </div>

          <div className="halloween-step">
          <fieldset className="halloween-keycap-picker">
            <legend><span className="halloween-step-label" aria-hidden="true">STEP 3</span>Build your fidget clicker!</legend>
            <p className="studio-note">Choose a board above, then click a Halloween keycap to fill that slot.</p>
            <div className="halloween-keycap-grid">
              {keycaps.map(keycap => <button type="button" className={`halloween-keycap-card card-${keycap.colour} ${selectedKeycaps.includes(keycap.id) ? 'is-selected' : ''}`} key={keycap.id} onClick={() => chooseKeycap(keycap.id)}>
                <img className="halloween-card-art" src={keycap.image} alt={`${keycap.name} Halloween keycap`} />
                <strong>{keycap.name}</strong>
                <small>{keycap.description}</small>
                {selectedKeycaps.includes(keycap.id) && <em>In your design</em>}
              </button>)}
            </div>
          </fieldset>
          </div>
          </section>
        </div>
        <section className="halloween-extras" aria-label="Additional keycaps">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>Need more keycaps?</h2>
          <p>Extra keycaps are separate from your clicker board. Choose any of the Halloween designs above; they won’t change your board layout or its selected keycaps.</p>
          <div className="halloween-extra-choices">
            {keycaps.map(keycap => {
              const quantity = extras.filter(extra => extra === keycap.id).length
              return <div className="halloween-extra-card" key={keycap.id}>
                <img src={keycap.image} alt="" />
                <strong>{keycap.name}</strong>
                <div className="halloween-extra-quantity" role="group" aria-label={`${keycap.name} extra keycaps`}>
                  <button type="button" aria-label={`Remove one ${keycap.name} extra keycap`} disabled={quantity === 0} onClick={() => updateExtraQuantity(keycap.id, -1)}>−</button>
                  <output aria-label={`${keycap.name} quantity`}>{quantity}</output>
                  <button type="button" aria-label={`Add one ${keycap.name} extra keycap`} disabled={extras.length >= 20} onClick={() => updateExtraQuantity(keycap.id, 1)}>+</button>
                </div>
              </div>
            })}
          </div>
          <p className="studio-note">Additional keycap pricing is pending; checkout remains unavailable for this design.</p>
        </section>
        <section className="studio-purchase creation-summary halloween-purchase" aria-label="Your Halloween creation">
          <div>
            <p className="eyebrow">YOUR CREATION</p>
            <h2>Halloween Fidget Clicker</h2>
            <p className="studio-note">{layout.label} · {draft.boardColour} · {selectedNames.join(' · ') || 'Choose your keycaps'}{extras.length ? ` · ${extras.length} extra ${extras.length === 1 ? 'keycap' : 'keycaps'}` : ''}</p>
            <div id="halloween-completion" className="studio-completion" data-complete={selectedKeycaps.length === layout.slots && extras.every(extra => extra !== null)} role="status" aria-atomic="true">
              <strong>{selectedKeycaps.length} / {layout.slots} keycaps selected</strong>
              <span>{selectedKeycaps.length !== layout.slots ? 'Fill each board slot to continue.' : 'Your design is ready to save.'}</span>
            </div>
          </div>
          <div className="studio-price-action">
            <dl>
              <div><dt>Board layout</dt><dd>Price pending</dd></div>
              <div><dt>Halloween keycaps ({selectedKeycaps.length})</dt><dd>Price pending</dd></div>
              {extras.length > 0 && <div><dt>Extra keycaps ({extras.length})</dt><dd>Price pending</dd></div>}
              <div className="studio-total"><dt>Total</dt><dd>Unavailable</dd></div>
            </dl>
            <button type="button" className="studio-add" aria-describedby="halloween-completion halloween-cart-note" disabled={selectedKeycaps.length !== layout.slots || storageFailed} onClick={addCreation}>Add my creation to cart</button>
            <p id="halloween-cart-note" className="studio-note">Your cart saves a copy of this design. Checkout is not available until pricing is configured.</p>
            {storageFailed && <p role="alert">Cart storage is unavailable. Please retry before leaving this page.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}

export default HalloweenStudioPage
