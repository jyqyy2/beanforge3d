import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getCharacterColours, getCustomKeycapPricing, getProductBySlug } from '../data/catalogue'
import KeycapPreview from '../components/KeycapPreview'
import type { KeycapConfiguration } from '../types/keycap'
import { calculateKeycapPrice } from '../utils/keycapPricing'
import { useCart } from '../context/useCart'
import { cartItemIdentity } from '../utils/cartIdentity'
import { keycapDraftStorageKey, readKeycapDraft } from '../utils/keycapDraft'

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
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (editIdentity !== null) return
    try {
      localStorage.setItem(keycapDraftStorageKey, JSON.stringify({ version: 1, count, configuration: { schemaVersion: 3, boardColour: colour, characters } }))
    } catch {
      return
    }
  }, [editIdentity, count, colour, characters])
  const configuration: KeycapConfiguration = { schemaVersion: 3, boardColour: colour, characters: characters.slice(0, count) }
  const characterColours = getCharacterColours()
  const selectedIndex = activeIndex !== null && activeIndex < count ? activeIndex : null
  const quote = calculateKeycapPrice(configuration, pricing)
  const addCreation = () => {
    if (!quote.complete || quote.totalMinor === null) return
    if (editIdentity !== null) {
      if (updateCartDesign(editIdentity, configuration)) navigate('/cart')
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
    setCharacters((current) => current.map((item, position) => position === index ? { character: nextCharacter, colour: item.colour || (nextCharacter ? (colour === 'Cream' ? 'Black' : 'Cream') : '') } : item))
    setMessage('')
  }
  return <main className="keycap-studio" data-colour={colour}>
    <Link to={editIdentity === null ? '/#custom' : '/cart'} className="back-link">{editIdentity === null ? '← Back to the shop' : '← Cancel and return to cart'}</Link>
    <header className="studio-heading"><p className="eyebrow">THE BEANFORGE KEYCAP STUDIO</p><h1>{editIdentity === null ? 'Build your own.' : 'Refine your creation.'}</h1><p>{editIdentity === null ? 'Your name. Your lucky number. Your little daily reminder.' : 'Changes apply to every copy in this cart row when you save. Matching designs combine quantities.'}</p></header>
    <div className="studio-layout">
      <KeycapPreview configuration={configuration} activeIndex={activeIndex} />
      <section className="studio-options" aria-label="Design your keycaps">
        <div className="studio-settings"><fieldset><legend>{count} {count === 1 ? 'board' : 'boards'} <span>· one character each</span></legend><div className="studio-choices">{Array.from({length: 8}, (_, i) => i + 1).map((amount) => <button type="button" key={amount} aria-pressed={count === amount} aria-label={`${amount} ${amount === 1 ? 'board' : 'boards'}`} onClick={() => { setCount(amount); setActiveIndex(null); setMessage('') }}>{amount}</button>)}</div></fieldset><fieldset><legend>Board colour <span>· {colour}</span></legend><div className="studio-choices">{colours.map((option) => <button type="button" key={option} aria-pressed={colour === option} onClick={() => { setColour(option); setMessage('') }}><span className="studio-swatch" data-colour={option} aria-hidden="true" />{option}</button>)}</div></fieldset></div>
        <fieldset aria-describedby="studio-characters-help">
          <legend>Make it yours.</legend>
          <p id="studio-characters-help" className="studio-note">Choose a tile to type A–Z or 0–9 and adjust its colour.</p>
          <div className="studio-characters">
            {configuration.characters.map((item, index) => (
              <label key={index} data-character-colour={item.colour} data-selected={selectedIndex === index}>
                <span>Character {index + 1}</span>
                <input aria-label={`Character ${index + 1}`} type="text" value={item.character}
                  maxLength={1} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                  aria-controls="character-colour-palette"
                  onFocus={(event) => { setActiveIndex(index); event.target.select() }}
                  onClick={() => setActiveIndex(index)}
                  onChange={(event) => updateCharacter(index, event.target.value)} />
                <span className="character-colour-dot" aria-hidden="true" />
                <span>{item.colour || 'Auto colour'}</span>
              </label>
            ))}
          </div>
          {selectedIndex !== null && (
            <div id="character-colour-palette" className="character-palette">
              <p id="character-palette-label">Character {selectedIndex + 1} · {characters[selectedIndex].character || 'blank'} colour</p>
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
                <button type="button" onClick={() => setActiveIndex(null)}>Close palette</button>
              </div>
            </div>
          )}
          <p className="studio-note">New characters receive a contrasting colour. Your chosen colours and hidden characters are retained when you change the board or count.</p>
        </fieldset>
      </section>
      <section className="studio-purchase" aria-label="Your creation price"><div><p className="eyebrow">YOUR CREATION</p><h2>{count} {count === 1 ? 'board' : 'boards'} · {colour}</h2><p id="studio-completion" role="status">{quote.completed} / {count} keycaps complete. {quote.complete ? '✓ Ready to save to cart.' : 'Add a character to each remaining tile.'}</p><p className="studio-note">Temporary development prices — not a production quote.</p></div><div className="studio-price-action"><dl><div><dt>Board layout</dt><dd>{quote.boardMinor === null ? 'Unavailable' : money(quote.boardMinor)}</dd></div><div><dt>Character keycaps ({quote.completed})</dt><dd>{money(quote.charactersMinor)}</dd></div><div className="studio-total"><dt>{quote.complete ? 'Total' : 'Total so far'}</dt><dd>{quote.totalMinor === null ? 'Unavailable' : money(quote.totalMinor)}</dd></div></dl><button type="button" className="studio-add" disabled={!quote.complete} aria-describedby="studio-completion studio-cart-note" onClick={addCreation}>{editIdentity === null ? 'Add my creation to cart' : 'Save changes to cart'}</button><p id="studio-cart-note" className="studio-note">Your cart saves a copy of this design. Checkout is not available yet.</p><p role="status" className="studio-action-message">{message}</p>{message && <Link to="/cart" className="back-link">View cart →</Link>}</div></section>
      <p className="studio-session-note">{editIdentity === null ? 'Your draft, including hidden characters, is saved on this browser when local storage is available.' : 'Unsaved cart edits reset when you leave or refresh. Your separate studio draft is not changed.'}</p>
    </div>
  </main>
}
