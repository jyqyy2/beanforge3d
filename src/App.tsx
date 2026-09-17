import { createBrowserRouter, RouterProvider, Routes, Route, Link } from 'react-router-dom'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import KeycapStudioPage from './pages/KeycapStudioPage'
import nameTag from './assets/name-tag-1280.webp'
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
}> = {
  'bean-keycap': {
    description: 'For keyboards that need a little bean.',
    label: 'BEAN',
    imageClass: 'product-image-bean',
    pricePrefix: '',
  },
  'custom-name-keychain': {
    description: 'Your name. Your colour. Your way.',
    label: 'ABC',
    imageClass: 'product-image-keychain',
    pricePrefix: 'From ',
  },
  'qr-nfc-stand': {
    description: 'A little stand for your business.',
    label: 'SCAN',
    imageClass: 'product-image-stand',
    pricePrefix: 'From ',
  },
}

function Header() {
  const { cartItems } = useCart()

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

                  <a className="button button-light" href="#custom">
                    Make something custom
                  </a>
                </div>
              </div>

              <div className="hero-product">
                <ResponsiveImage
                  src={nameTag}
                  width={1280}
                  height={1280}
                  sizes="(max-width: 520px) 90vw, (max-width: 850px) 70vw, 460px"
                  fetchPriority="high"
                  alt="BeanForge custom name tag"
                />
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
                    KEY
                  </div>

                  <h3>Keycaps</h3>
                  <p>
                    Give your keyboard a little personality.
                  </p>
                </a>

                <a href="#skadis" className="category-card">
                  <span>02</span>

                  <div className="category-visual category-visual-skadis">
                    SKÅDIS
                  </div>

                  <h3>SKÅDIS</h3>
                  <p>
                    Modular accessories for a tidier space.
                  </p>
                </a>

                <a href="#qr-nfc" className="category-card">
                  <span>03</span>

                  <div className="category-visual category-visual-qr">
                    SCAN
                  </div>

                  <h3>QR / NFC</h3>
                  <p>
                    Useful stands and displays for businesses.
                  </p>
                </a>

                <a href="#custom" className="category-card">
                  <span>04</span>

                  <div className="category-visual category-visual-custom">
                    MADE
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
                <h2>Featured things</h2>
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

                        {product.image && (
                          <ResponsiveImage
                            src={product.image}
                            alt={product.name}
                            width={1280}
                            height={1280}
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

              <div className="center-button">
                <a className="button button-dark" href="#shop">
                  View all products
                </a>
              </div>
            </section>

            <section className="custom-section" id="custom">
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
