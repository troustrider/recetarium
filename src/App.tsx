import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigationType, type Location } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useTransform } from 'framer-motion'
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'
import InstallPrompt from './components/shared/InstallPrompt'
import useScrollDeRuta from './hooks/useScrollDeRuta'
import useArrastreAtras from './hooks/useArrastreAtras'
import { FUNDIDO, PILA, esProfunda } from './utils/paginas'

const Catalogo      = lazy(() => import('./pages/Catalogo'))
const Favoritas     = lazy(() => import('./pages/Favoritas'))
const DetalleReceta = lazy(() => import('./pages/DetalleReceta'))
const NuevaReceta   = lazy(() => import('./pages/NuevaReceta'))
const EditarReceta  = lazy(() => import('./pages/EditarReceta'))
const Planificador  = lazy(() => import('./pages/Planificador'))
const Despensa      = lazy(() => import('./pages/Despensa'))
const NotFound      = lazy(() => import('./pages/NotFound'))
const AdminSesiones = lazy(() => import('./pages/AdminSesiones'))

function Rutas({ location }: { location: Location }) {
  return (
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
  )
}

function App() {
  const location = useLocation()
  const atras = useNavigationType() === 'POP'
  useScrollDeRuta()

  // La ruta que se deja atrás, para dibujarla debajo mientras el dedo arrastra.
  // Va en estado y no en referencia porque se lee al pintar.
  const [previa, setPrevia] = useState<Location | null>(null)
  const actual = useRef(location)
  useEffect(() => {
    if (actual.current.key !== location.key) setPrevia(actual.current)
    actual.current = location
  }, [location])

  const hayAnterior = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
  const desliza = esProfunda(location.pathname) || atras
  const { x, arrastrando, manejadores } = useArrastreAtras(hayAnterior)
  const debajo = useTransform(x, (v) => `${-28 + (28 * Math.min(v / (window.innerWidth || 1), 1))}%`)
  const veloDebajo = useTransform(x, (v) => 0.55 + 0.45 * Math.min(v / (window.innerWidth || 1), 1))


  return (
    <MotionConfig reducedMotion="user">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          {/* `relative` no es decorativo: `popLayout` saca de la caja a la
              pantalla que se va poniéndola en absoluto, y sin un ancestro
              posicionado su referencia sería el documento entero —perdería el
              centrado y el margen y saltaría a la esquina antes de irse—. El
              `w-full` es lo mismo para el ancho, que en absoluto se encoge al
              contenido. Y el recorte impide que la pantalla que entra desde la
              derecha asome como scroll horizontal. */}
          <div className="relative [overflow-x:clip]" {...manejadores}>
            {arrastrando && previa && (
              <motion.div
                className="absolute inset-x-0 top-0 w-full"
                style={{ x: debajo, opacity: veloDebajo }}
                aria-hidden
              >
                <Rutas location={previa} />
              </motion.div>
            )}
            <AnimatePresence mode="popLayout" initial={false} custom={atras}>
              <motion.div
                key={location.pathname}
                className="w-full"
                custom={atras}
                variants={desliza ? PILA : FUNDIDO}
                initial="entra"
                animate="quieta"
                exit="sale"
                transition={{ duration: desliza ? 0.32 : 0.16, ease: [0.32, 0.72, 0, 1] }}
                style={arrastrando ? { x, boxShadow: '-14px 0 34px rgba(0,0,0,0.28)' } : undefined}
              >
                <Rutas location={location} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Suspense>
        <InstallPrompt />
      </Layout>
    </MotionConfig>
  )
}

export default App
