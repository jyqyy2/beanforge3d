import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductBySlug } from '../data/catalogue'
import KeycapPreview from '../components/KeycapPreview'
import type { KeycapConfiguration } from '../types/keycap'
import './KeycapStudioPage.css'

export default function KeycapStudioPage() {
  const product = getProductBySlug('bean-keycap')
  const colours = product?.colours ?? []
  const [count, setCount] = useState(1)
  const [colour, setColour] = useState(colours[0] ?? '')
  const [letters, setLetters] = useState<string[]>(Array(8).fill(''))
  const configuration: KeycapConfiguration = {
    schemaVersion: 1,
    colour,
    letters: letters.slice(0, count),
  }

  return (
    <main className="keycap-studio">
      <Link to="/#custom" className="back-link">← Back to the shop</Link>
      <header className="studio-heading">
        <p className="eyebrow">THE BEANFORGE KEYCAP STUDIO</p>
        <h1>Build your own.</h1>
        <p>A letter. A name. A little something that feels like you.</p>
      </header>
      {colours.length === 0 ? <p>Our keycap palette is unavailable. Please check back soon.</p> : (
        <div className="studio-layout">
          <KeycapPreview configuration={configuration} />
          <section className="studio-options" aria-label="Design your keycaps">
            <fieldset>
              <legend>How many keycaps?</legend>
              <div className="studio-choices">
                {Array.from({ length: 8 }, (_, index) => index + 1).map((amount) => (
                  <button type="button" key={amount} aria-pressed={count === amount}
                    aria-label={`${amount} ${amount === 1 ? 'keycap' : 'keycaps'}`}
                    onClick={() => setCount(amount)}>{amount}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Pick a colour</legend>
              <div className="studio-choices">
                {colours.map((option) => (
                  <button type="button" key={option} aria-pressed={colour === option}
                    onClick={() => setColour(option)}>{option}</button>
                ))}
              </div>
              <p className="studio-note">Try our current Bean Keycap palette.</p>
            </fieldset>
            <fieldset aria-describedby="studio-letters-help">
              <legend>Make it say something</legend>
              <p id="studio-letters-help" className="studio-note">One letter A–Z per keycap. Change any option, any time.</p>
              <div className="studio-letters">
                {configuration.letters.map((letter, index) => (
                  <label key={index}>
                    <span>Letter {index + 1}</span>
                    <input type="text" value={letter} maxLength={1} autoComplete="off"
                      autoCapitalize="characters" spellCheck={false}
                      onChange={(event) => {
                        const nextLetter = event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
                        setLetters((current) => current.map((value, position) => position === index ? nextLetter : value))
                      }} />
                  </label>
                ))}
              </div>
              <p className="studio-note">Fewer keycaps? Hidden letters are remembered while you stay in the studio.</p>
            </fieldset>
            <p className="studio-availability">Explore your layout here. Custom keycap ordering isn’t available yet. Your sketch stays on this page and resets when you leave.</p>
          </section>
        </div>
      )}
    </main>
  )
}
