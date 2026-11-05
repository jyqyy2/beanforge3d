import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { productPath, useStorefront } from '../data/storefrontContext'
import './ShopPage.css'

function ShopPage() {
  const { products: catalogue, loading, error } = useStorefront()
  const collections = [{ label: 'All products', value: 'all' }, ...[...new Set(catalogue.map(product => product.category))].map(value => ({ label: value, value }))]
  const location = useLocation()
  const [collection, setCollection] = useState<string>('all')
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (location.hash === '#product-search') document.getElementById('product-search')?.focus()
  }, [location.hash, location.key])
  const search = query.trim().toLocaleLowerCase()
  const searchTerms = search.endsWith('s') && search.length > 3 ? [search, search.slice(0, -1)] : [search]
  const products = catalogue.filter(product =>
    (collection === 'all' || product.category === collection) &&
    (!search || searchTerms.some(term => `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase().includes(term)))
  )

  return <main className="shop-page">
    <div className="shop-page-inner">
      <header className="shop-intro">
        <p className="eyebrow">THE BEANFORGE SHOP</p>
        <h1>Find your little favourite.</h1>
        <p>Thoughtful 3D-printed pieces for keyboards, gifts and everyday spaces. Pick a product to explore its options.</p>
      </header>

      <section className="shop-catalogue" aria-labelledby="shop-catalogue-title">
        <div className="shop-toolbar">
          <div>
            <p className="eyebrow">EXPLORE THE COLLECTION</p>
            <h2 id="shop-catalogue-title">Shop products</h2>
          </div>
          <div className="shop-search">
            <label htmlFor="product-search">Search products</label>
            <input id="product-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try keycaps or stands" />
          </div>
        </div>

        <div className="shop-filters" role="group" aria-label="Filter by collection">
          {collections.map(option => <button
            type="button"
            key={option.value}
            className={collection === option.value ? 'shop-filter is-selected' : 'shop-filter'}
            aria-pressed={collection === option.value}
            onClick={() => setCollection(option.value)}
          >{option.label}</button>)}
        </div>
        <p className="shop-result-count" role="status">{loading ? 'Loading products…' : error ?? products.length + (products.length === 1 ? ' product' : ' products')}</p>

        {!loading && !error && (products.length ? <div className="shop-product-grid">
          {products.map(product => <Link className="shop-product" to={productPath(product.slug)} key={product.slug}>
            <div className="shop-product-image">
              {product.image && <img src={product.image} alt="" loading="lazy" />}
            </div>
            <div className="shop-product-details">
              <span className="shop-product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="shop-product-bottom">
                <strong>{product.priceDisplay === 'from' ? 'From ' : ''}S${product.price.toFixed(2)}</strong>
                <span>{product.category === 'Studio' ? 'Open studio →' : 'View options →'}</span>
              </div>
            </div>
          </Link>)}
        </div> : <div className="shop-empty">
          <h3>No matches yet.</h3>
          <p>Try a different search or browse all products.</p>
          <button type="button" onClick={() => { setQuery(''); setCollection('all') }}>Show all products</button>
        </div>)}
      </section>

      <aside className="shop-studio-callout">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>Looking for something personal?</h2>
          <p>Choose a studio product and build a design with your own colours and details.</p>
        </div>
        <Link to="/studio">Explore the studio →</Link>
      </aside>
    </div>
  </main>
}

export default ShopPage
