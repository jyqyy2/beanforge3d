import { Link } from 'react-router-dom'
import halloweenImage from '../assets/halloweenimg.png'
import studioImage from '../assets/landing-studio.png'
import heroImage from '../assets/hero.png'
import './StudioHubPage.css'

type StudioProduct = {
  title: string
  eyebrow: string
  description: string
  href?: string
  image: string
  imageAlt: string
  badge: string
  action: string
}

const studioProducts: StudioProduct[] = [
  {
    title: 'Keycap Studio',
    eyebrow: 'PERSONALISED NAME CLICKER',
    description: 'Build a small set of letters, colours and character details made around your idea.',
    href: '/studio/keycaps',
    image: heroImage,
    imageAlt: 'Cream, pink and charcoal custom keycaps',
    badge: 'PERSONAL',
    action: 'Open the studio',
  },
  {
    title: 'F1 Fidget Clickers',
    eyebrow: 'RACES DROP',
    description: 'A satisfying little desk object inspired by the rhythm, colour and energy of race day.',
    image: studioImage,
    imageAlt: 'BeanForge 3D product detail',
    badge: 'FOR RACE LOVERS',
    action: 'Open the studio',
  },
  {
    title: 'Halloween Fidget Clicker',
    eyebrow: 'SEASONAL DROP',
    description: 'A playful seasonal clicker with a little more mischief for your desk or display shelf.',
    href: '/studio/halloween',
    image: halloweenImage,
    imageAlt: 'BeanForge 3D Halloween themed product image',
    badge: 'HALLOWEEN',
    action: 'Open the studio',
  },
]

function StudioHubPage() {
  return (
    <main className="studio-hub">
      <section className="studio-hub-hero" aria-labelledby="studio-hub-title">
        <div className="studio-hub-hero-copy">
          <p className="eyebrow">THE BEANFORGE WORKSHOP</p>
          <h1 id="studio-hub-title">Choose something<br />to make your own.</h1>
          <p className="studio-hub-introduction">
            Personalise a small object with a big personality.<br/>Start with keycaps,
            then explore new clickers and seasonal ideas as they arrive.
          </p>
        </div>
        <div className="studio-hub-hero-mark" aria-hidden="true">
          <span>Make it<br /><em>yours.</em></span>
          <i>✦</i>
        </div>
      </section>

      <section className="studio-hub-list" aria-labelledby="studio-products-title">
        <div className="studio-hub-heading">
          <div>
            <p className="eyebrow">CUSTOM CREATIONS</p>
            <h2 id="studio-products-title">Pick your starting point.</h2><br/>
          </div>
          <p>Each product opens into its own focused experience, so there is room to make every detail feel considered.</p>
        </div>

        <div className="studio-product-grid">
          {studioProducts.map((product, index) => {
            const content = (
              <>
                <div className="studio-product-image">
                  <img src={product.image} alt={product.imageAlt} loading={index === 0 ? 'eager' : 'lazy'} />
                  <span className="studio-product-badge">{product.badge}</span>
                </div>
                <div className="studio-product-number">0{index + 1}</div>
                <div className="studio-product-copy">
                  <p className="eyebrow">{product.eyebrow}</p>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                </div>
                <span className="studio-product-action">{product.action} <strong>↗</strong></span>
              </>
            )

            return product.href
              ? <Link className="studio-product-card studio-product-card-active" to={product.href} key={product.title}>{content}</Link>
              : <article className="studio-product-card studio-product-card-soon" key={product.title}>{content}</article>
          })}
        </div>
      </section>
    </main>
  )
}

export default StudioHubPage
