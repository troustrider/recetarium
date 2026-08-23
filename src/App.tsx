import { lazy, Suspense, useMemo } from 'react'
import { Routes, Route, useLocation, useNavigationType, type Location } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useTransform } from 'framer-motion'
import Layout from './components/shared/Layout'
import LoadingSpinner from './components/shared/LoadingSpinner'
import InstallPrompt from './components/shared/InstallPrompt'
import useScrollDeRuta, { scrollGuardado } from './hooks/useScrollDeRuta'
import useArrastreAtras from './hooks/useArrastreAtras'
import usePilaDeRutas from './hooks/usePilaDeRutas'
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

  const { indice, previa } = usePilaDeRutas()
  const desliza = esProfunda(location.pathname) || atras
  const { x, arrastrando, porGesto, contenedor } = useArrastreAtras(indice > 0)
  const paso = useMemo(() => ({ atras, sinAnimar: porGesto }), [atras, porGesto])
  const debajo = useTransform(x, (v) => `${-28 + (28 * Math.min(v / (window.innerWidth || 1), 1))}%`)
  const veloDebajo = useTransform(x, (v) => 0.55 + 0.45 * Math.min(v / (window.innerWidth || 1), 1))

  return (
    <MotionConfig reducedMotion="user">
      <Layout>
        {/* Las dos pantallas comparten casilla de rejilla, que es la manera de
            superponerlas sin sacar ninguna de la caja. `popLayout` hacía eso
            mismo poniendo en absoluto a la que se va, y con ello el alto del
            documento pasaba de golpe al de la que llega: si el scroll no cabía
            en el nuevo alto el navegador lo recortaba, y ese recorte es el
            fotograma descolocado que se veía al entrar y al salir. En rejilla
            el contenedor mide lo que la más alta de las dos y no encoge hasta
            que la anterior se desmonta, ya con el scroll en su sitio.

            `relative` sostiene la capa del arrastre, `items-start` impide que
            la más corta se estire hasta la otra, y el recorte lateral impide
            que la que entra desde la derecha asome como scroll horizontal. */}
        <div ref={contenedor} className="relative grid items-start [overflow-x:clip]">
          {arrastrando && previa && (
            <motion.div
              className="absolute inset-x-0 w-full pointer-events-none"
              // Se dibuja por su principio, y la ruta de debajo casi nunca
              // estaba ahí: sin corregir el desplazamiento asoma un trozo
              // cualquiera del catálogo y al soltar salta a su sitio.
              style={{ top: window.scrollY - scrollGuardado(previa.key), x: debajo, opacity: veloDebajo }}
              aria-hidden
            >
              <Suspense fallback={null}>
                <Rutas location={previa} />
              </Suspense>
            </motion.div>
          )}
          <AnimatePresence initial={false} custom={paso}>
            <motion.div
              key={location.pathname}
              className="w-full [grid-area:1/1]"
              custom={paso}
              variants={desliza ? PILA : FUNDIDO}
              initial={porGesto ? false : 'entra'}
              animate="quieta"
              exit="sale"
              transition={{ duration: desliza ? 0.32 : 0.16, ease: [0.32, 0.72, 0, 1] }}
              style={arrastrando ? { x, boxShadow: '-14px 0 34px rgba(0,0,0,0.28)' } : undefined}
            >
              {/* La espera del trozo de código va por pantalla y no envolviendo
                  a las dos: arriba, un `lazy` sin resolver cambia el árbol
                  entero por el indicador y desmonta la transición a media
                  animación, que es la pantalla en blanco de un parpadeo. */}
              <Suspense fallback={<LoadingSpinner />}>
                <Rutas location={location} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <InstallPrompt />
      </Layout>
    </MotionConfig>
  )
}

export default App
