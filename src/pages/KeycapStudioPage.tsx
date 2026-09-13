import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomKeycapPricing, getProductBySlug } from '../data/catalogue'
import KeycapPreview from '../components/KeycapPreview'
import type { KeycapConfiguration } from '../types/keycap'
import { calculateKeycapPrice } from '../utils/keycapPricing'
import './KeycapStudioPage.css'
import './KeycapColours.css'

const money = (minor: number) => `S$${(minor / 100).toFixed(2)}`

export default function KeycapStudioPage() {
  const colours = getProductBySlug('bean-keycap')?.colours ?? []
  const pricing = getCustomKeycapPricing()
  const [count, setCount] = useState(1)
  const [colour, setColour] = useState(colours[0] ?? '')
  const [characters, setCharacters] = useState<KeycapConfiguration['characters']>(() => Array.from({ length: 8 }, () => ({ character: '', colour: '' })))
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const configuration: KeycapConfiguration = { schemaVersion: 3, boardColour: colour, characters: characters.slice(0, count) }
  const characterColours = ['Cream', 'Pink', 'Blue', 'Black']
  const selectedIndex = activeIndex !== null && activeIndex < count ? activeIndex : null
  const quote = calculateKeycapPrice(configuration, pricing)
  const updateCharacter = (index: number, value: string) => {
    const nextCharacter = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1)
    setCharacters((current) => current.map((item, position) => position === index ? { character: nextCharacter, colour: item.colour || (nextCharacter ? (colour === 'Cream' ? 'Black' : 'Cream') : '') } : item))
    setMessage('')
  }
  return <main className="keycap-studio" data-colour={colour}>
    <Link to="/#custom" className="back-link">← Back to the shop</Link>
    <header className="studio-heading"><p className="eyebrow">THE BEANFORGE KEYCAP STUDIO</p><h1>Build your own.</h1><p>Your name. Your lucky number. Your little daily reminder.</p></header>
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
      <section className="studio-purchase" aria-label="Your creation price"><div><p className="eyebrow">YOUR CREATION</p><h2>{count} {count === 1 ? 'board' : 'boards'} · {colour}</h2><p id="studio-completion" role="status">{quote.completed} / {count} keycaps complete. {quote.complete ? '✓ Ready for the cart step.' : 'Add a character to each remaining tile.'}</p><p className="studio-note">Temporary development prices — not a production quote.</p></div><div className="studio-price-action"><dl><div><dt>Board layout</dt><dd>{quote.boardMinor === null ? 'Unavailable' : money(quote.boardMinor)}</dd></div><div><dt>Character keycaps ({quote.completed})</dt><dd>{money(quote.charactersMinor)}</dd></div><div className="studio-total"><dt>{quote.complete ? 'Total' : 'Total so far'}</dt><dd>{quote.totalMinor === null ? 'Unavailable' : money(quote.totalMinor)}</dd></div></dl><button type="button" className="studio-add" disabled={!quote.complete} aria-describedby="studio-completion studio-cart-note" onClick={() => setMessage('Your creation is complete. Cart integration is coming in a later milestone; nothing was added.')}>Add my creation to cart</button><p id="studio-cart-note" className="studio-note">Preview action only; configured cart items are not available yet.</p><p role="status" className="studio-action-message">{message}</p></div></section>
      <p className="studio-session-note">Your design stays here while you explore. Leaving or refreshing resets it.</p>
    </div>
  </main>
}
