import type { KeycapConfiguration } from '../types/keycap'
import '../pages/KeycapStudioPage.css'
import '../pages/KeycapColours.css'

export default function KeycapPreview({ configuration, activeIndex = null, compact = false, onSelectCharacter }: { configuration: KeycapConfiguration; activeIndex?: number | null; compact?: boolean; onSelectCharacter?: (index: number) => void }) {
  return (
    <section className={compact ? 'keycap-preview keycap-preview-compact' : 'keycap-preview'} aria-label="Keycap layout preview">
      {!compact && <p className="eyebrow">YOUR LIVE PREVIEW</p>}
      <div className="keycap-strip" data-board-colour={configuration.boardColour} aria-hidden={onSelectCharacter ? undefined : true}>
        {configuration.characters.map((character, index) => (
          <span className="keycap-object" data-active={activeIndex === index} key={index}>
            <span className="keycap-module">
              {onSelectCharacter && <button type="button" className="keycap-select" aria-label={character.character ? `Select character ${index + 1}: ${character.character}` : `Character ${index + 1}, empty. Add a character.`} aria-pressed={activeIndex === index} onClick={() => onSelectCharacter(index)} />}
              <span className="keycap-housing" />
              {character.character && <span className="keycap-sketch" data-character-colour={character.colour} data-symbol-colour={character.characterColour}>{character.character}</span>}
              {!compact && !character.character && <span className="keycap-empty" aria-hidden="true">+</span>}
            </span>
            <small>{index + 1}</small>
            {!compact && <span className="preview-slot-state">{character.character ? '✓' : 'Empty'}</span>}
          </span>
        ))}
      </div>
      <div className="preview-summary" aria-hidden="true">
        <span>{configuration.characters.length} {configuration.characters.length === 1 ? 'board' : 'boards'}</span>
        <span><span className="studio-swatch" data-colour={configuration.boardColour} />{configuration.boardColour}</span>
      </div>
      <p className="studio-sr-only" role={compact ? undefined : 'status'} aria-live={compact ? undefined : 'polite'} aria-atomic={compact ? undefined : true}>
        {configuration.characters.length} {configuration.characters.length === 1 ? 'board' : 'boards'} · Board: {configuration.boardColour}
        {' · '}{configuration.characters.map(({ character, colour, characterColour }) => character ? `${character} (keycap: ${colour}, character: ${characterColour ?? (colour === 'Black' ? 'Cream' : 'Black')})` : 'blank').join(' · ')}
      </p>
    </section>
  )
}
