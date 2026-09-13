import type { KeycapConfiguration } from '../types/keycap'

export default function KeycapPreview({ configuration, activeIndex }: { configuration: KeycapConfiguration; activeIndex: number | null }) {
  return (
    <section className="keycap-preview" aria-label="Keycap layout preview">
      <p className="eyebrow">YOUR CREATION · MADE PERSONAL</p>
      <div className="keycap-strip" data-colour={configuration.colour} aria-hidden="true">
        {configuration.characters.map((character, index) => (
          <span className="keycap-object" data-active={activeIndex === index} key={index}>
            <span className="keycap-sketch">{character || '·'}</span>
            <small>{index + 1}</small>
          </span>
        ))}
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {configuration.characters.length} {configuration.characters.length === 1 ? 'board' : 'boards'} · {configuration.colour}
        {' · '}{configuration.characters.map((character) => character || 'blank').join(' ')}
      </p>
      <p className="studio-note">Illustrative preview · final shapes and colours may differ.</p>
    </section>
  )
}
