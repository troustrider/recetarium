import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'
import InstallPrompt from './components/shared/InstallPrompt'
import useScrollDeRuta from './hooks/useScrollDeRuta'
import useDeslizarAtras from './hooks/useDeslizarAtras'

const Catalogo      = lazy(() => import('./pages/Catalogo'))
const Favoritas     = lazy(() => import('./pages/Favoritas'))
const DetalleReceta = lazy(() => import('./pages/DetalleReceta'))
const NuevaReceta   = lazy(() => import('./pages/NuevaReceta'))
const EditarReceta  = lazy(() => import('./pages/EditarReceta'))
const Planificador  = lazy(() => import('./pages/Planificador'))
const Despensa      = lazy(() => import('./pages/Despensa'))
const NotFound      = lazy(() => import('./pages/NotFound'))
const AdminSesiones = lazy(() => import('./pages/AdminSesiones'))

function App() {
  const location = useLocation()
  useScrollDeRuta()
  useDeslizarAtras()


  return (
    <MotionConfig reducedMotion="user">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          {/* Sin `mode="wait"`: las dos pantallas tienen que coexistir un
              instante para que la foto de la tarjeta pueda crecer hasta la
              cabecera de la ficha. `popLayout` saca de la caja a la que se va,
              así que la que llega no espera ni empuja. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              <Routes location={location}>
                <Route index element={<Catalogo />} />
                <Route path="favoritas" element={<Favoritas />} />
                <Route path="planificador" element={<Planificador />} />
                <Route path="despensa" element={<Despensa />} />
                <Route path="recetas/nueva" element={<NuevaReceta />} />
                <Route path="recetas/:id" element={<DetalleReceta />} />
                <Route path="recetas/:id/editar" element={<EditarReceta />} />
                <Route path="admin/sesiones" element={<AdminSesiones />} />
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
