import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecetasProvider, ListaCompraProvider } from './context'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RecetasProvider>
        <ListaCompraProvider>
          <App />
        </ListaCompraProvider>
      </RecetasProvider>
    </BrowserRouter>
  </StrictMode>,
)
