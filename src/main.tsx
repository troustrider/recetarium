import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DeshacerProvider, RecetasProvider, ListaCompraProvider, PlanificadorProvider, DespensaProvider, CompradosProvider, PendientesPlanProvider } from './context'
import { SesionProvider } from './context/SesionContext'
import Puerta from './components/shared/Puerta'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
      <Puerta>
      <DeshacerProvider>
        <RecetasProvider>
          <DespensaProvider>
            <ListaCompraProvider>
              <PendientesPlanProvider>
                <PlanificadorProvider>
                  <CompradosProvider>
                    <App />
                  </CompradosProvider>
                </PlanificadorProvider>
              </PendientesPlanProvider>
            </ListaCompraProvider>
          </DespensaProvider>
        </RecetasProvider>
      </DeshacerProvider>
      </Puerta>
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
