import { createBrowserRouter, RouterProvider, Routes, Route, Link } from 'react-router-dom'
import CartConfirmation from './components/CartConfirmation'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutResultPage from './pages/CheckoutResultPage'
import KeycapStudioPage from './pages/KeycapStudioPage'
import StudioHubPage from './pages/StudioHubPage'
import HalloweenStudioPage from './pages/HalloweenStudioPage'
import ShopPage from './pages/ShopPage'
import landingHero from './assets/halloweenimg.png'
import categoryKeycaps from './assets/landing-category-keycaps.png'
import categorySkadis from './assets/landing-category-skadis.png'
import categoryQr from './assets/landing-category-qr.png'
import categoryCustom from './assets/landing-category-custom.png'
import productCustom from './assets/landing-product-custom.png'
import productQr from './assets/landing-product-qr.png'
import carPlateRed from './assets/carplate-red.png'
import studioImage from './assets/landing-studio.png'
import studioImage2 from './assets/hero.png'
import customBanner from './assets/landing-custom-banner.png'
import corporateBanner from './assets/landing-corporate-banner.png'
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
  'custom-carplate-keychain': {
    description: 'Your plate. Your colour. Made personal.',
    label: 'CUSTOM',
    image: carPlateRed,
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
    pricePrefix: '',
  },
}

const categoryGroups: {
  id: string
  eyebrow: string
  title: string
  categories: { name: string; description: string; to?: string; image: string | null }[]
}[] = [
  {
    id: 'make-it-yours',
    eyebrow: 'EXPLORE THE COLLECTION',
    title: 'Make it yours',
    categories: [
      { name: 'Keycap Studio', description: 'Choose your letters, colours and layout.', to: '/studio', image: studioImage },
      { name: 'Custom Nametags', description: 'Names and words made just for you.', to: '/product/custom-name-keychain', image: categoryCustom },
      { name: 'Custom Carplate Keychain', description: 'Personalised plates made your way.', to: '/product/custom-carplate-keychain', image: carPlateRed },
    ],
  },
  {
    id: 'shop-the-collection',
    eyebrow: 'READY TO DISCOVER',
    title: 'Little favourites',
    categories: [
      { name: 'QR / NFC', description: 'Character stands for counters and businesses.', to: '/product/qr-nfc-stand', image: categoryQr },
      { name: 'Keycaps', description: 'Small details for keyboards with personality.', to: '/studio/keycaps', image: categoryKeycaps },
      { name: 'SKADIS Accessories', description: 'Modular pieces for a tidier setup.', image: categorySkadis },
    ],
  },
]

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
        <Link to="/shop">Shop</Link>
        <Link to="/studio">Customise</Link>
        <a href="/#corporate">Corporate</a>
        <a href="/#about">About</a>
      </nav>

      <div className="header-actions">
        <Link to="/shop#product-search" className="header-action-link" aria-label="Search products">⌕</Link>
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
    <CartConfirmation />

    <Routes>
    <Route path="/studio" element={<StudioHubPage />} />
    <Route path="/studio/halloween" element={<HalloweenStudioPage />} />
    <Route path="/studio/keycaps" element={<KeycapStudioPage />} />
    <Route path="/shop" element={<ShopPage />} />

    {/* Product details */}
    <Route
      path="/product/:slug"
      element={<ProductPage />}
    />

    {/* Cart page */}
    <Route
      path="/cart"
      element={<CartPage />}
    />
    <Route path="/checkout/success" element={<CheckoutResultPage />} />

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
                  Little things.
                  <br />
                  Big joy.
                </h1>

                <p className="hero-text">
                  Design keycaps in your colours, find playful pieces for your desk,
                  or make a gift that feels like you. Little things, made with care.
                </p>

                <div className="hero-actions">
                  <Link className="button button-dark" to="/studio">Make your own →</Link>
                  <Link className="button button-light" to="/shop">Explore the shop</Link>
                </div>
              </div>

              <div className="hero-product">
                <ResponsiveImage
                  src={landingHero}
                  width={284}
                  height={251}
                  sizes="(max-width: 520px) 90vw, (max-width: 850px) 70vw, 460px"
                  fetchPriority="high"
                  alt="Halloween fidget clickers with pumpkin, ghost, skull, spider and cat keycaps"
                />
                <span className="hero-handwritten" aria-hidden="true">Small details,<br />big joy ♡</span>
              </div>
            </section>

            <section className="categories" id="shop" aria-labelledby="categories-title">
              {categoryGroups.map((group) => (
                <div className="category-group" id={group.id} key={group.id}>
                  <div className="category-group-heading">
                    <div>
                      <p className="eyebrow">{group.eyebrow}</p>
                      <h2 id={group.id === 'make-it-yours' ? 'categories-title' : undefined}>{group.title}</h2>
                    </div>
                    <Link className="category-group-link" to={group.id === 'make-it-yours' ? '/studio' : '/shop'}>
                      {group.id === 'make-it-yours' ? 'Open the studio' : 'See products'} →
                    </Link>
                  </div>
                  <div className="category-grid">
                    {group.categories.map((category) => {
                      const content = <>
                        <div className="category-visual">
                          {!category.to && <span className="category-badge">Coming soon</span>}
                          {category.image
                            ? <img src={category.image} alt="" width="259" height="180" loading="lazy" />
                            : <span className="category-placeholder">Something personal.<br />In the making.</span>}
                        </div>
                        <h4>{category.name}</h4>
                        <p>{category.description}</p>
                      </>
                      return category.to
                        ? <Link key={category.name} to={category.to} className="category-card">{content}</Link>
                        : <article key={category.name} className="category-card category-coming-soon">{content}</article>
                    })}
                  </div>
                </div>
              ))}
            </section>

            <section className="landing-studio" aria-labelledby="landing-studio-title">
              <div>
                <p className="eyebrow">THE KEYCAP STUDIO</p>
                <h2 id="landing-studio-title">Design your<br />own keycaps.</h2>
                <p>Create something uniquely yours. Choose your letters and colours, express your style — and bring your ideas to life, one keycap at a time.</p>
                <Link className="button button-light" to="/studio">Start designing →</Link>
              </div>
              <img src={studioImage2} alt="J, O and Y keycaps in cream, pink and charcoal" width="259" height="210" loading="lazy" />
            </section>

            <section className="featured" id="keycaps">
              <div className="section-heading">
                <p className="eyebrow">THE BEANFORGE SHOP</p>
                <h2>Featured products</h2>
                <Link className="featured-browse" to="/shop">View all products →</Link>
              </div>

              <div className="product-grid">

                {getProducts().map((product) => {
                  const presentation = featuredPresentation[product.slug]
                  if (!presentation) return null

                  return (
                    <article className="product-card" key={product.slug} id={product.slug === 'qr-nfc-stand' ? 'qr-nfc' : undefined}>
                      <div className={`product-image ${presentation.imageClass}`}>
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

            <section className="custom-section" id="custom">
              <img className="landing-gifts" src={customBanner} alt="Personalised keycap keychains on wrapped gifts" width="295" height="163" loading="lazy" />
              <div className="custom-content">
                <p className="eyebrow">BESPOKE IDEAS</p>

                <h2>Have something in mind?</h2>

                <p>
                  Something beyond keycaps? A desk accessory, a name tag
                  or a thoughtful gift — made around your own idea.
                </p>

                <a
                  className="custom-studio-link"
                  href="/studio"
                >
                  Explore the keycap studio →
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
              <img className="corporate-banner-image" src={corporateBanner} alt="BeanForge 3D gift box wrapped with twine" width="287" height="140" loading="lazy" />
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
              <Link to="/shop">Shop</Link>
              <Link to="/studio">Customise</Link>
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
