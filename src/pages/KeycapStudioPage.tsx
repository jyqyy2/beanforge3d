import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useSearchParams } from 'react-router-dom'
import { getCharacterColours, getCustomKeycapPricing, getProductBySlug } from '../data/catalogue'
import KeycapPreview from '../components/KeycapPreview'
import type { KeycapConfiguration } from '../types/keycap'
import { calculateKeycapPrice } from '../utils/keycapPricing'
import { useCart } from '../context/useCart'
import { cartItemIdentity } from '../utils/cartIdentity'
import { readKeycapDraft, saveKeycapDraft } from '../utils/keycapDraft'

const money = (minor: number) => `S$${(minor / 100).toFixed(2)}`

export default function KeycapStudioPage() {
  const [searchParams] = useSearchParams()
  const { cartItems } = useCart()
  const editIdentity = searchParams.get('edit')
  const cartItem = editIdentity === null ? undefined : cartItems.find((item) => item.configuration && cartItemIdentity(item) === editIdentity)
  if (editIdentity !== null && !cartItem) return <main className="keycap-studio">
    <h1>This design is no longer in your cart.</h1>
    <p>It may have been removed or changed. Your other designs are safe.</p>
    <Link to="/cart" className="back-link">Return to cart</Link>
    <p><Link to="/studio/keycaps">Open your studio draft</Link></p>
  </main>
  return <KeycapStudioEditor key={editIdentity ?? 'draft'} editIdentity={editIdentity} savedConfiguration={cartItem?.configuration} />
}

function KeycapStudioEditor({ editIdentity, savedConfiguration }: { editIdentity: string | null; savedConfiguration?: KeycapConfiguration }) {
  const { addToCart, updateCartDesign } = useCart()
  const navigate = useNavigate()
  const colours = getProductBySlug('bean-keycap')?.colours ?? []
  const pricing = getCustomKeycapPricing()
  const [draft] = useState(() => editIdentity === null ? readKeycapDraft() : null)
  const [count, setCount] = useState(savedConfiguration?.characters.length ?? draft?.count ?? 1)
  const [colour, setColour] = useState(savedConfiguration?.boardColour ?? draft?.configuration.boardColour ?? colours[0] ?? '')
  const [characters, setCharacters] = useState<KeycapConfiguration['characters']>(() => Array.from({ length: 8 }, (_, index) => ({ ...(savedConfiguration?.characters[index] ?? draft?.configuration.characters[index] ?? { character: '', colour: '' }) })))
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const characterInputs = useRef<Array<HTMLInputElement | null>>([])
  const lastCharacterIndex = useRef(0)
  const restoringFocus = useRef(false)
  const closePalette = () => {
    restoringFocus.current = true
    if (activeIndex !== null) characterInputs.current[activeIndex]?.focus()
    restoringFocus.current = false
    setActiveIndex(null)
  }
  const [message, setMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const resetButton = useRef<HTMLButtonElement>(null)
  const [saveResult, setSaveResult] = useState<{ snapshot: string; saved: boolean } | null>(null)
  const draftSnapshot = JSON.stringify({ version: 1, count, configuration: { schemaVersion: 3, boardColour: colour, characters } })
  useEffect(() => {
    if (editIdentity !== null) return
    const saved = saveKeycapDraft(JSON.parse(draftSnapshot))
    const timer = window.setTimeout(() => setSaveResult({ snapshot: draftSnapshot, saved }), 0)
    return () => window.clearTimeout(timer)
  }, [editIdentity, draftSnapshot])
  const resetDraft = () => {
    setCount(1)
    setColour(colours[0] ?? '')
    setCharacters(Array.from({ length: 8 }, () => ({ character: '', colour: '' })))
    setActiveIndex(null)
    setMessage('')
    setConfirmReset(false)
    resetButton.current?.focus()
  }
  const configuration: KeycapConfiguration = { schemaVersion: 3, boardColour: colour, characters: characters.slice(0, count) }
  const savedSuccessfully = useRef(false)
  const dirty = editIdentity !== null && JSON.stringify(configuration) !== JSON.stringify(savedConfiguration)
  const blocker = useBlocker(() => dirty && !savedSuccessfully.current)
  useEffect(() => {
    if (!dirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (savedSuccessfully.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [dirty])
  const characterColours = getCharacterColours()
  const selectedIndex = activeIndex !== null && activeIndex < count ? activeIndex : null
  const quote = calculateKeycapPrice(configuration, pricing)
  const addCreation = () => {
    if (!quote.complete || quote.totalMinor === null) return
    if (editIdentity !== null) {
      if (updateCartDesign(editIdentity, configuration)) {
        savedSuccessfully.current = true
        navigate('/cart', { state: { designSaved: true } })
      }
      else setMessage('This design could not be updated. Please return to your cart and try again.')
      return
    }
    addToCart({
      productSlug: 'custom-keycaps',
      name: `Custom keycaps · ${configuration.characters.map(({ character }) => character).join('')}`,
      price: quote.totalMinor / 100,
      colour: configuration.boardColour,
      quantity: 1,
      configuration: { ...configuration, characters: configuration.characters.map((item) => ({ ...item })) },
    })
    setMessage('Your creation was added to your cart.')
  }
  const updateCharacter = (index: number, value: string) => {
    const nextCharacter = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1)
    setCharacters((current) => current.map((item, position) => position === index ? { ...item, character: nextCharacter, colour: item.colour || (nextCharacter ? (colour === 'Cream' ? 'Black' : 'Cream') : '') } : item))
    setMessage('')
  }
  return <main className="keycap-studio" data-colour={colour}>
    <Link to={editIdentity === null ? '/#custom' : '/cart'} className="back-link">{editIdentity === null ? '← Back to the shop' : '← Cancel and return to cart'}</Link>
    <header className="studio-heading"><p className="eyebrow">THE BEANFORGE KEYCAP STUDIO</p><h1>{editIdentity === null ? 'Build your own.' : 'Refine your creation.'}</h1><p>{editIdentity === null ? 'Your name. Your lucky number. Your little daily reminder.' : 'Changes apply to every copy in this cart row when you save. Matching designs combine quantities.'}</p></header>
    <div className="studio-layout">
      {blocker.state === 'blocked' && <section role="alertdialog" aria-modal="false" aria-labelledby="unsaved-title" aria-describedby="unsaved-description">
        <h2 id="unsaved-title">Leave without saving?</h2>
        <p id="unsaved-description">Your cart still contains the original design. These edits will be discarded.</p>
        <div className="studio-choices">
          <button type="button" autoFocus onClick={() => {
            blocker.reset()
            characterInputs.current[Math.min(lastCharacterIndex.current, count - 1)]?.focus()
          }}>Keep editing</button>
          <button type="button" onClick={() => blocker.proceed()}>Discard edits and leave</button>
        </div>
      </section>}
      {editIdentity === null && <section className="studio-draft-toolbar" aria-label="Studio draft">
        <p role="status">{saveResult?.snapshot !== draftSnapshot ? 'Saving draft…' : saveResult.saved ? 'Draft saved on this browser' : 'Draft not saved. Keep this page open to avoid losing changes.'}</p>
        <div className="studio-choices"><button ref={resetButton} type="button" aria-expanded={confirmReset} aria-controls="draft-reset-confirmation" onClick={() => setConfirmReset(true)}>Start new design</button></div>
        {confirmReset && <div id="draft-reset-confirmation" role="group" aria-label="Confirm new design">
          <p className="studio-note">Replace this draft? All eight characters and their colours will reset, including hidden slots. Saved cart designs will not change.</p>
          <div className="studio-choices">
            <button type="button" onClick={() => { setConfirmReset(false); resetButton.current?.focus() }}>Keep my design</button>
            <button type="button" onClick={resetDraft}>Confirm new design</button>
          </div>
        </div>}
      </section>}
      <KeycapPreview configuration={configuration} activeIndex={activeIndex} />
      <section className="studio-options" aria-label="Design your keycaps">
        <div className="studio-settings"><fieldset><legend>{count} {count === 1 ? 'board' : 'boards'} <span>· one character each</span></legend><div className="studio-choices">{Array.from({length: 8}, (_, i) => i + 1).map((amount) => <button type="button" key={amount} aria-pressed={count === amount} aria-label={`${amount} ${amount === 1 ? 'board' : 'boards'}`} onClick={() => { setCount(amount); setActiveIndex(null); setMessage('') }}>{amount}</button>)}</div></fieldset><fieldset><legend>Board colour <span>· {colour}</span></legend><div className="studio-choices">{colours.map((option) => <button type="button" key={option} aria-pressed={colour === option} onClick={() => { setColour(option); setMessage('') }}><span className="studio-swatch" data-colour={option} aria-hidden="true" />{option}</button>)}</div></fieldset></div>
        <fieldset aria-describedby="studio-characters-help">
          <legend>Make it yours.</legend>
          <p id="studio-characters-help" className="studio-note">Choose a tile to type A–Z or 0–9. Set its keycap colour and the character colour separately.</p>
          <div className="studio-characters">
            {configuration.characters.map((item, index) => (
              <label key={index} data-character-colour={item.colour} data-symbol-colour={item.characterColour} data-selected={selectedIndex === index}>
                <span>Character {index + 1}</span>
                <input aria-label={`Character ${index + 1}`} type="text" value={item.character}
                  ref={(element) => { characterInputs.current[index] = element }}
                  maxLength={1} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                  aria-controls={selectedIndex !== null ? 'character-colour-palette' : undefined}
                  onFocus={(event) => { lastCharacterIndex.current = index; if (!restoringFocus.current) setActiveIndex(index); event.target.select() }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') { event.preventDefault(); closePalette() }
                    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index) }
                  }}
                  onClick={() => setActiveIndex(index)}
                  onChange={(event) => updateCharacter(index, event.target.value)} />
                <span className="character-colour-dot" aria-hidden="true" />
                <span>{item.colour || 'Auto colour'}</span>
              </label>
            ))}
          </div>
          {selectedIndex !== null && (
            <div id="character-colour-palette" className="character-palette" onKeyDown={(event) => {
              if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePalette() }
            }}>
              <div className="palette-heading"><strong>Character {selectedIndex + 1}</strong><span>{characters[selectedIndex].character || 'Choose a character'}</span></div>
              <p id="character-palette-label">Keycap colour</p>
              <div className="studio-choices" role="group" aria-labelledby="character-palette-label">
                {characterColours.map((option) => (
                  <button type="button" key={option}
                    aria-pressed={characters[selectedIndex].colour === option}
                    onClick={() => {
                      setCharacters((current) => current.map((item, index) => index === selectedIndex ? { ...item, colour: option } : item))
                      setMessage('')
                    }}>
                    <span className="studio-swatch" data-colour={option} aria-hidden="true" />{option}
                  </button>
                ))}
              </div>
              <p id="symbol-palette-label">Character colour</p>
              <div className="studio-choices" role="group" aria-labelledby="symbol-palette-label">
                <button type="button" aria-pressed={characters[selectedIndex].characterColour === undefined}
                  onClick={() => {
                    setCharacters((current) => current.map((item, index) => index === selectedIndex ? { ...item, characterColour: undefined } : item))
                    setMessage('')
                  }}>Auto contrast</button>
                {characterColours.map((option) => <button type="button" key={option}
                  aria-pressed={characters[selectedIndex].characterColour === option}
                  onClick={() => {
                    setCharacters((current) => current.map((item, index) => index === selectedIndex ? { ...item, characterColour: option } : item))
                    setMessage('')
                  }}><span className="studio-swatch" data-colour={option} aria-hidden="true" />{option}</button>)}
              </div>
              {characters[selectedIndex].characterColour === characters[selectedIndex].colour && <p className="studio-note">Matching keycap and character colours may be difficult to see. Try Auto contrast.</p>}
              <div className="studio-choices palette-footer"><button type="button" onClick={closePalette}>Close palette</button></div>
            </div>
          )}
          <p className="studio-note">New characters receive a contrasting colour. Your chosen colours and hidden characters are retained when you change the board or count.</p>
        </fieldset>
      </section>
      <section className="studio-purchase" aria-label="Your creation price"><div><p className="eyebrow">YOUR CREATION</p><h2>{count} {count === 1 ? 'board' : 'boards'} · {colour}</h2><p id="studio-completion" role="status">{quote.completed} / {count} keycaps complete. {quote.complete ? '✓ Ready to save to cart.' : 'Add a character to each remaining tile.'}</p><p className="studio-note">Temporary development prices — not a production quote.</p></div><div className="studio-price-action"><dl><div><dt>Board layout</dt><dd>{quote.boardMinor === null ? 'Unavailable' : money(quote.boardMinor)}</dd></div><div><dt>Character keycaps ({quote.completed})</dt><dd>{money(quote.charactersMinor)}</dd></div><div className="studio-total"><dt>{quote.complete ? 'Total' : 'Total so far'}</dt><dd>{quote.totalMinor === null ? 'Unavailable' : money(quote.totalMinor)}</dd></div></dl><button type="button" className="studio-add" disabled={!quote.complete} aria-describedby="studio-completion studio-cart-note" onClick={addCreation}>{editIdentity === null ? 'Add my creation to cart' : 'Save changes to cart'}</button><p id="studio-cart-note" className="studio-note">Your cart saves a copy of this design. Checkout is not available yet.</p><p role="status" className="studio-action-message">{message}</p>{message && <Link to="/cart" className="back-link">View cart →</Link>}</div></section>
      {editIdentity !== null && <p className="studio-session-note">Unsaved cart edits reset when you leave or refresh. Your separate studio draft is not changed.</p>}
    </div>
  </main>
}
