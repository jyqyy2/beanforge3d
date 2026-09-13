import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)

/* Everything inside CartProvider can now access the same cart.
CartProvider
└── App
    ├── Header
    ├── Homepage
    ├── Product Page
    └── eventually... Cart Page
*/