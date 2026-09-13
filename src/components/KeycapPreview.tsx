import type { KeycapConfiguration } from '../types/keycap'
import '../pages/KeycapStudioPage.css'
import '../pages/KeycapColours.css'

export default function KeycapPreview({ configuration, activeIndex = null, compact = false }: { configuration: KeycapConfiguration; activeIndex?: number | null; compact?: boolean }) {
  return (
    <section className={compact ? 'keycap-preview keycap-preview-compact' : 'keycap-preview'} aria-label="Keycap layout preview">
      {!compact && <p className="eyebrow">YOUR CREATION · MADE PERSONAL</p>}
      <div className="keycap-strip" data-board-colour={configuration.boardColour} aria-hidden="true">
        {configuration.characters.map((character, index) => (
          <span className="keycap-object" data-active={activeIndex === index} key={index}>
            <span className="keycap-module">
              <span className="keycap-housing" />
              {character.character && <span className="keycap-sketch" data-character-colour={character.colour}>{character.character}</span>}
            </span>
            <small>{index + 1}</small>
          </span>
        ))}
      </div>
      <p role={compact ? undefined : 'status'} aria-live={compact ? undefined : 'polite'} aria-atomic={compact ? undefined : true}>
        {configuration.characters.length} {configuration.characters.length === 1 ? 'board' : 'boards'} · Board: {configuration.boardColour}
        {' · '}{configuration.characters.map(({ character, colour }) => character ? `${character} (${colour})` : 'blank').join(' · ')}
      </p>
      {!compact && <p className="studio-note">Illustrative preview · final shapes and colours may differ.</p>}
    </section>
  )
}
