import type { KeycapConfiguration } from '../types/keycap'

export default function KeycapPreview({ configuration, activeIndex }: { configuration: KeycapConfiguration; activeIndex: number | null }) {
  return (
    <section className="keycap-preview" aria-label="Keycap layout preview">
      <p className="eyebrow">YOUR CREATION · MADE PERSONAL</p>
      <div className="keycap-strip" data-board-colour={configuration.boardColour} aria-hidden="true">
        {configuration.characters.map((character, index) => (
          <span className="keycap-object" data-character-colour={character.colour} data-active={activeIndex === index} key={index}>
            <span className="keycap-sketch">{character.character || '·'}</span>
            <small>{index + 1}</small>
          </span>
        ))}
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {configuration.characters.length} {configuration.characters.length === 1 ? 'board' : 'boards'} · Board: {configuration.boardColour}
        {' · '}{configuration.characters.map(({ character, colour }) => character ? `${character} (${colour})` : 'blank').join(' · ')}
      </p>
      <p className="studio-note">Illustrative preview · final shapes and colours may differ.</p>
    </section>
  )
}
