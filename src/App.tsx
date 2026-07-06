import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'

const Catalogo      = lazy(() => import('./pages/Catalogo'))
const Favoritas     = lazy(() => import('./pages/Favoritas'))
const DetalleReceta = lazy(() => import('./pages/DetalleReceta'))
const NuevaReceta   = lazy(() => import('./pages/NuevaReceta'))
const EditarReceta  = lazy(() => import('./pages/EditarReceta'))
const Planificador  = lazy(() => import('./pages/Planificador'))
const Despensa      = lazy(() => import('./pages/Despensa'))
const NotFound      = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Catalogo />} />
          <Route path="favoritas" element={<Favoritas />} />
          <Route path="planificador" element={<Planificador />} />
          <Route path="despensa" element={<Despensa />} />
          <Route path="recetas/nueva" element={<NuevaReceta />} />
          <Route path="recetas/:id" element={<DetalleReceta />} />
          <Route path="recetas/:id/editar" element={<EditarReceta />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
