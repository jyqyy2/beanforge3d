import { createBrowserRouter, RouterProvider, Routes, Route, Link, useLocation } from 'react-router-dom'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import KeycapStudioPage from './pages/KeycapStudioPage'
import landingHero from './assets/landing-hero.png'
import categoryKeycaps from './assets/landing-category-keycaps.png'
import categorySkadis from './assets/landing-category-skadis.png'
import categoryQr from './assets/landing-category-qr.png'
import categoryCustom from './assets/landing-category-custom.png'
import productKeycap from './assets/landing-product-keycap.png'
import productCustom from './assets/landing-product-custom.png'
import productQr from './assets/landing-product-qr.png'
import studioImage from './assets/landing-studio.png'
import giftsImage from './assets/landing-gifts.png'
import ResponsiveImage from './components/ResponsiveImage'
import { useCart } from './context/useCart'
import { getProducts } from './data/catalogue'
import './App.css'
import './Homepage.css'

const featuredPresentation: Record<string, {
  description: string
  label: string
  imageClass: string
  pricePrefix: string
  image: string
}> = {
  'bean-keycap': {
    description: 'For keyboards that need a little bean.',
    label: 'KEYCAPS',
    image: productKeycap,
    imageClass: 'product-image-bean',
    pricePrefix: '',
  },
  'custom-name-keychain': {
    description: 'Your name. Your colour. Your way.',
    label: 'CUSTOM',
    image: productCustom,
    imageClass: 'product-image-keychain',
    pricePrefix: 'From ',
  },
  'qr-nfc-stand': {
    description: 'A little stand for your business.',
    label: 'QR / NFC',
    image: productQr,
    imageClass: 'product-image-stand',
    pricePrefix: 'From ',
  },
}

function Header() {
  const { cartItems } = useCart()
  const { pathname } = useLocation()

  const cartItemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <header className="header">
      <Link className="logo" to="/">
        BEANFORGE <span>3D</span>
      </Link>

      <nav className="nav">
        <a href="/#shop">Shop</a>
        {pathname === '/' && <Link to="/studio/keycaps">Keycap Studio</Link>}
        <a href="/#custom">Custom</a>
        <a href="/#corporate">Corporate</a>
        <a href="/#about">About</a>
      </nav>

      <div className="header-actions">
        <button aria-label="Search">⌕</button>
        <button aria-label="Wishlist">♡</button>
        <Link
          to="/cart"
          className="header-action-link cart-link"
          aria-label={`Shopping cart with ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}`}
        >
          🛒
          {cartItemCount > 0 && (
            <span className="cart-count">{cartItemCount}</span>
          )}
        </Link>
      </div>
    </header>
  )
}

function AppLayout() {
return (
  <>
    <Header />

    <Routes>
    <Route path="/studio/keycaps" element={<KeycapStudioPage />} />

    {/* Bean Keycap product page */}
    <Route
      path="/product/:slug"
      element={<ProductPage />}
    />

    {/* Cart page */}
    <Route
      path="/cart"
      element={<CartPage />}
    />

    {/* Homepage */}
    <Route
      path="*"
      element={
        <div className="site">
          <main>
            <section className="hero">
              <div className="hero-content">
                <p className="eyebrow">
                  3D PRINTED • CUSTOM • MADE WITH CARE
                </p>

                <h1>
                  Small things.
                  <br />
                  Made for you.
                </h1>

                <p className="hero-text">
                  3D printed goods, custom gifts and useful little
                  creations designed to make everyday things a little more
                  fun.
                </p>

                <div className="hero-actions">
                  <a className="button button-dark" href="#shop">
                    Shop now
                  </a>

                  <Link className="button button-light" to="/studio/keycaps">
                    Explore keycap studio
                  </Link>
                </div>
              </div>

              <div className="hero-product">
                <ResponsiveImage
                  src={landingHero}
                  width={284}
                  height={251}
                  sizes="(max-width: 520px) 90vw, (max-width: 850px) 70vw, 460px"
                  fetchPriority="high"
                  alt="Cream, pink and charcoal keycaps with playful character designs"
                />
                <span className="hero-handwritten" aria-hidden="true">Small details,<br />big joy ♡</span>
              </div>
            </section>

            <section className="categories" id="shop">
              <div className="section-heading">
                <p className="eyebrow">EXPLORE</p>
                <h2>Shop by category</h2>
              </div>

              <div className="category-grid">

                <a href="#keycaps" className="category-card">
                  <span>01</span>

                  <div className="category-visual category-visual-keycaps">
                    <img src={categoryKeycaps} alt="" width="131" height="88" loading="lazy" />
                  </div>

                  <h3>Keycaps</h3>
                  <p>
                    Give your keyboard a little personality.
                  </p>
                </a>

                <a href="#skadis" className="category-card">
                  <span>02</span>

                  <div className="category-visual category-visual-skadis">
                    <img src={categorySkadis} alt="" width="133" height="89" loading="lazy" />
                  </div>

                  <h3>SKÅDIS</h3>
                  <p>
                    Modular accessories for a tidier space.
                  </p>
                </a>

                <a href="#qr-nfc" className="category-card">
                  <span>03</span>

                  <div className="category-visual category-visual-qr">
                    <img src={categoryQr} alt="" width="133" height="88" loading="lazy" />
                  </div>

                  <h3>QR / NFC</h3>
                  <p>
                    Useful stands and displays for businesses.
                  </p>
                </a>

                <a href="#custom" className="category-card">
                  <span>04</span>

                  <div className="category-visual category-visual-custom">
                    <img src={categoryCustom} alt="" width="133" height="88" loading="lazy" />
                  </div>

                  <h3>Custom</h3>
                  <p>
                    Made-to-order pieces made for you.
                  </p>
                </a>

              </div>
            </section>

            <section className="featured" id="keycaps">
              <div className="section-heading">
                <p className="eyebrow">THE BEANFORGE SHOP</p>
                <h2>Featured products</h2>
                <a className="featured-browse" href="#shop">View all products →</a>
              </div>

              <div className="product-grid">

                {getProducts().map((product) => {
                  const presentation = featuredPresentation[product.slug]
                  if (!presentation) return null

                  return (
                    <article className="product-card" key={product.slug}>
                      <div className={`product-image ${presentation.imageClass}`}>
                        <button
                          className="product-wishlist"
                          aria-label={`Add ${product.name} to wishlist`}
                        >
                          ♡
                        </button>

                        {presentation.image && (
                          <ResponsiveImage
                            src={presentation.image}
                            alt={product.name}
                            width={190}
                            height={100}
                            loading="lazy"
                            sizes="(max-width: 600px) 88vw, (max-width: 850px) 42vw, 340px"
                          />
                        )}
                        <span>{presentation.label}</span>
                      </div>

                      <div className="product-info">
                        <div>
                          <h3>{product.name}</h3>
                          <p>{presentation.description}</p>
                        </div>

                        <strong>{presentation.pricePrefix}S${product.price.toFixed(2)}</strong>
                      </div>

                      <a
                        className="product-link"
                        href={`/product/${product.slug}`}
                      >
                        View product →
                      </a>
                    </article>
                  )
                })}

              </div>

            </section>

            <section className="landing-studio" aria-labelledby="landing-studio-title">
              <div>
                <p className="eyebrow">THE KEYCAP STUDIO</p>
                <h2 id="landing-studio-title">Design your<br />own keycaps</h2>
                <p>Choose your letters and colours to create something uniquely yours. Perfect for names, initials, gifts and more.</p>
                <Link className="button button-light" to="/studio/keycaps">Start designing →</Link>
              </div>
              <img src={studioImage} alt="J, O and Y keycaps in cream, pink and charcoal" width="259" height="210" loading="lazy" />
            </section>

            <section className="custom-section" id="custom">
              <img className="landing-gifts" src={giftsImage} alt="Playful keycaps arranged beside a keyboard and a cup" width="356" height="167" loading="lazy" />
              <div className="custom-content">
                <p className="eyebrow">MADE FOR YOU</p>

                <h2>Have something in mind?</h2>

                <p>
                  A birthday gift. A desk accessory. A name tag. A
                  clicker for your work-from-home friend. Tell us what
                  you're thinking and we'll see what we can make.
                </p>

                <a
                  className="button button-light"
                  href="/studio/keycaps"
                >
                  Explore the keycap studio
                </a>
              </div>
            </section>

            <section
              className="corporate-section"
              id="corporate"
            >
              <div className="corporate-content">
                <div>
                  <p className="eyebrow">FOR BUSINESSES</p>

                  <h2>
                    Made for teams, events &amp; clients.
                  </h2>
                </div>

                <div>
                  <p>
                    Custom-coloured accessories, name tags, QR stands,
                    onboarding kits and corporate gifts — made to your
                    specifications.
                  </p>

                  <a
                    className="text-link"
                    href="#corporate-request"
                  >
                    Talk to us →
                  </a>
                </div>
              </div>
            </section>
          </main>

          <footer className="footer" id="about">
            <div>
              <Link className="logo" to="/">
                BEANFORGE <span>3D</span>
              </Link>

              <p>Small things. Made for you.</p>
            </div>

            <div className="footer-links">
              <a href="#shop">Shop</a>
              <Link to="/studio/keycaps">Keycap Studio</Link>
              <a href="#custom">Custom</a>
              <a href="#corporate">Corporate</a>
              <a href="#about">About</a>
            </div>

            <p className="copyright">
              © 2026 BeanForge 3D
            </p>
          </footer>
        </div>
      }
    />

    </Routes>
  </>

)
}

const router = createBrowserRouter([{ path: '*', element: <AppLayout /> }])

export default function App() {
  return <RouterProvider router={router} />
}
