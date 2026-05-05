import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecetasProvider, ListaCompraProvider, PlanificadorProvider, DespensaProvider } from './context'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RecetasProvider>
        <ListaCompraProvider>
          <PlanificadorProvider>
            <DespensaProvider>
              <App />
            </DespensaProvider>
          </PlanificadorProvider>
        </ListaCompraProvider>
      </RecetasProvider>
    </BrowserRouter>
  </StrictMode>,
)
