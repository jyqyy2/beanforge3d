import type { KeycapConfiguration } from '../types/keycap'

export default function KeycapPreview({ configuration }: { configuration: KeycapConfiguration }) {
  return (
    <section className="keycap-preview" aria-label="Keycap layout preview">
      <p className="eyebrow">YOUR LITTLE CREATION</p>
      <div className="keycap-strip" data-colour={configuration.colour} aria-hidden="true">
        {configuration.letters.map((letter, index) => (
          <span className="keycap-sketch" key={index}>{letter || '·'}</span>
        ))}
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {configuration.letters.length} {configuration.letters.length === 1 ? 'keycap' : 'keycaps'} · {configuration.colour}
        {' · '}{configuration.letters.map((letter) => letter || 'blank').join(' ')}
      </p>
      <p className="studio-note">Layout sketch only. Shapes and colours are illustrative, not a product render.</p>
    </section>
  )
}
