import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProductPage from './pages/ProductPage'
import { CartProvider } from './context/CartContext'
import nameTag from './assets/name-tag.jpg'
import './App.css'

function App() {
return (
<CartProvider>
  <BrowserRouter>
    <Routes>

    {/* Bean Keycap product page */}
    <Route
      path="/product/:slug"
      element={<ProductPage />}
    />

    {/* Homepage */}
    <Route
      path="*"
      element={
        <div className="site">
          <header className="header">
            <a className="logo" href="/">
              BEANFORGE <span>3D</span>
            </a>

            <nav className="nav">
              <a href="#shop">Shop</a>
              <a href="#custom">Custom</a>
              <a href="#corporate">Corporate</a>
              <a href="#about">About</a>
            </nav>

            <div className="header-actions">
              <button aria-label="Search">⌕</button>
              <button aria-label="Wishlist">♡</button>
              <button aria-label="Shopping cart">🛒</button>
            </div>
          </header>

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
                <img
                  src={nameTag}
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

                {/* Featured Product 1 */}
                <article className="product-card">
                  <div className="product-image product-image-bean">
                    <button
                      className="product-wishlist"
                      aria-label="Add Bean Keycap to wishlist"
                    >
                      ♡
                    </button>

                    <span>BEAN</span>
                  </div>

                  <div className="product-info">
                    <div>
                      <h3>Bean Keycap</h3>
                      <p>
                        For keyboards that need a little bean.
                      </p>
                    </div>

                    <strong>S$18.00</strong>
                  </div>

                  <a
                    className="product-link"
                    href="/product/bean-keycap"
                  >
                    View product →
                  </a>
                </article>

                {/* Featured Product 2 */}
                <article className="product-card">
                  <div className="product-image product-image-keychain">
                    <button
                      className="product-wishlist"
                      aria-label="Add Custom Name Keychain to wishlist"
                    >
                      ♡
                    </button>

                    <span>ABC</span>
                  </div>

                  <div className="product-info">
                    <div>
                      <h3>Custom Name Keychain</h3>
                      <p>
                        Your name. Your colour. Your way.
                      </p>
                    </div>

                    <strong>From S$9.00</strong>
                  </div>

                  <a
                  className="product-link"
                  href="/product/custom-name-keychain"
                >
                  View product →
                </a>
                </article>

                {/* Featured Product 3 */}
                <article className="product-card">
                  <div className="product-image product-image-stand">
                    <button
                      className="product-wishlist"
                      aria-label="Add QR NFC Stand to wishlist"
                    >
                      ♡
                    </button>

                    <span>SCAN</span>
                  </div>

                  <div className="product-info">
                    <div>
                      <h3>QR / NFC Stand</h3>
                      <p>
                        A little stand for your business.
                      </p>
                    </div>

                    <strong>From S$15.00</strong>
                  </div>

                  <a
                    className="product-link"
                    href="/product/qr-nfc-stand"
                  >
                    View product →
                  </a>
                </article>

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
                  href="#custom-request"
                >
                  Start a custom request
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
              <a className="logo" href="/">
                BEANFORGE <span>3D</span>
              </a>

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
  </BrowserRouter>
</CartProvider>

)
}

export default App