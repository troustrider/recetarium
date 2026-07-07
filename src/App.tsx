import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'
import InstallPrompt from './components/shared/InstallPrompt'

const Catalogo      = lazy(() => import('./pages/Catalogo'))
const Favoritas     = lazy(() => import('./pages/Favoritas'))
const DetalleReceta = lazy(() => import('./pages/DetalleReceta'))
const NuevaReceta   = lazy(() => import('./pages/NuevaReceta'))
const EditarReceta  = lazy(() => import('./pages/EditarReceta'))
const Planificador  = lazy(() => import('./pages/Planificador'))
const Despensa      = lazy(() => import('./pages/Despensa'))
const NotFound      = lazy(() => import('./pages/NotFound'))

function App() {
  const location = useLocation()

  // Con el shell persistente, el scroll no se reinicia solo entre rutas.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion="user">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <Routes location={location}>
                <Route index element={<Catalogo />} />
                <Route path="favoritas" element={<Favoritas />} />
                <Route path="planificador" element={<Planificador />} />
                <Route path="despensa" element={<Despensa />} />
                <Route path="recetas/nueva" element={<NuevaReceta />} />
                <Route path="recetas/:id" element={<DetalleReceta />} />
                <Route path="recetas/:id/editar" element={<EditarReceta />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
        <InstallPrompt />
      </Layout>
    </MotionConfig>
  )
}

export default App
