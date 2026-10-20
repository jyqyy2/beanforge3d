import type { HalloweenConfiguration } from '../types/halloween'
import pumpkinImage from '../assets/halloween-pumpkin.png'
import ghostImage from '../assets/halloween-ghost.png'
import skullImage from '../assets/halloween-skull.png'
import spiderImage from '../assets/halloween-spider.png'
import catSideImage from '../assets/halloween-cat-side.png'
import catBackImage from '../assets/halloween-cat-back.png'
import '../pages/HalloweenStudioPage.css'

const images = {
  pumpkin: pumpkinImage,
  ghost: ghostImage,
  skull: skullImage,
  spider: spiderImage,
  'cat-side': catSideImage,
  'cat-back': catBackImage,
}

export default function HalloweenCartPreview({ configuration }: { configuration: HalloweenConfiguration }) {
  const layoutClass = configuration.layout === '1x1' ? 'layout-one' : configuration.layout === '2x1' ? 'layout-two' :
    configuration.layout === '2x2' ? 'layout-four layout-square' : 'layout-four layout-tall'

  return <div className="halloween-cart-preview keycap-preview" role="img"
    aria-label={`${configuration.layout} ${configuration.boardColour} Halloween clicker with ${configuration.slots.join(', ')} keycaps`}>
    <div className={`halloween-board ${layoutClass} board-${configuration.boardColour.toLowerCase()}`}>
      <span className="halloween-board-handle" aria-hidden="true" />
      {configuration.slots.map((keycap, index) => <span className="halloween-slot" key={index} aria-hidden="true">
        <img className="halloween-slot-image" src={images[keycap]} alt="" />
        <small>{index + 1}</small>
      </span>)}
    </div>
    <div className="preview-summary" aria-hidden="true">
      <span>{configuration.layout.replace('x', ' × ')}</span>
      <span><span className="studio-swatch" data-colour={configuration.boardColour} />{configuration.boardColour}</span>
    </div>
  </div>
}
