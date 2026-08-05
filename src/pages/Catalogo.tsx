import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices } from 'lucide-react'
import { useRecetasContext } from '../context'
import { useListaCompraContext, useDespensa } from '../context'
import { faltantes } from '../utils/despensa'
import useFiltros, { type Orden } from '../hooks/useFiltros'
import type { Receta } from '../types/receta'
import RecetaCard from '../components/recetas/RecetaCard'
import AbanicoRecetas from '../components/recetas/AbanicoRecetas'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

// El catálogo pasa de las 250 recetas: pintarlas todas de golpe son cientos de
// tarjetas animadas y sus imágenes, y cualquier repintado posterior arrastra
// con todas. Se pintan por tandas conforme se baja.
const POR_TANDA = 24

// PRNG determinista (mulberry32) para barajar sin ensuciar el render.
function prngDesde(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Catalogo() {
  const { recetas, loading, error, cargar, toggleFavorita } = useRecetasContext()
  const { toggleReceta, estaSeleccionada, cargarAleatorias } = useListaCompraContext()
  const { filtros, setFiltros, orden, setOrden, recetasFiltradas } = useFiltros(recetas)
  const { despensa } = useDespensa()
  const [searchParams] = useSearchParams()
  const [racionesAzar, setRacionesAzar] = useState(2)
  const [soloDisponibles, setSoloDisponibles] = useState(() => searchParams.get('disponibles') === '1')
  const navigate = useNavigate()

  const abrirReceta = useCallback((id: string) => navigate(`/recetas/${id}`), [navigate])

  const conDespensa = despensa.length > 0
  const faltanPorReceta = useMemo(
    () => (conDespensa ? new Map(recetas.map((r) => [r.id, faltantes(r, despensa).length])) : null),
    [recetas, despensa, conDespensa]
  )
  const cocinablesHoy = useMemo(
    () => (faltanPorReceta ? [...faltanPorReceta.values()].filter((n) => n === 0).length : 0),
    [faltanPorReceta]
  )

  const ORDENES: { valor: Orden; label: string }[] = [
    { valor: 'nombre', label: 'Nombre' },
    { valor: 'tiempo', label: 'Más rápidas' },
    { valor: 'proteina', label: 'Más proteína' },
    { valor: 'precio', label: 'Más baratas' },
  ]

  function limpiarTodo() {
    setFiltros({ categoria: '', sabor: '', tiempoMax: '', ingrediente: '' })
    setSoloDisponibles(false)
    if (searchParams.get('q')) navigate('/')
  }

  const q = searchParams.get('q')?.toLowerCase().trim() ?? ''
  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )

  const hayFiltrosActivos =
    !!q || soloDisponibles || filtros.categoria !== '' || filtros.sabor !== '' || filtros.tiempoMax !== '' || filtros.ingrediente !== ''

  const ingredientesUnicos = useMemo(
    () => [...new Set(recetas.flatMap((r) => r.ingredientes.map((i) => i.nombre.toLowerCase())))].sort(),
    [recetas]
  )

  // Semilla fresca en cada montaje: al entrar a la página sale un conjunto distinto
  const [seedAbanico] = useState(() => Math.floor(Math.random() * 2 ** 32))

  // "Recetas de hoy" — cocinables primero (0 faltan), luego falta 1, 2… pero el
  // orden DENTRO de cada nivel es aleatorio en cada visita, no siempre las mismas.
  // El barajado va sembrado en vez de con Math.random() para que el memo sea
  // puro: el orden cambia por montaje, no entre repintados del mismo montaje.
  const hoy = useMemo(() => {
    const aleatorio = prngDesde(seedAbanico)
    const barajar = <T,>(arr: T[]): T[] => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(aleatorio() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    if (!faltanPorReceta) return barajar(recetas).slice(0, 7)

    const porNivel = new Map<number, Receta[]>()
    for (const r of recetas) {
      const f = faltanPorReceta.get(r.id) ?? 99
      const grupo = porNivel.get(f)
      if (grupo) grupo.push(r)
      else porNivel.set(f, [r])
    }
    return [...porNivel.keys()]
      .sort((a, b) => a - b)
      .flatMap((nivel) => barajar(porNivel.get(nivel)!))
      .slice(0, 7)
  }, [recetas, faltanPorReceta, seedAbanico])

  const mostrarAbanico = !hayFiltrosActivos && hoy.length >= 3
  const tituloAbanico =
    cocinablesHoy > 0
      ? `Podéis cocinar ${cocinablesHoy} sin pisar el súper`
      : conDespensa
        ? 'Casi listas para hoy'
        : 'Elegidas para hoy'

  const resultados = useMemo(() => {
    const base = q
      ? recetasFiltradas.filter((r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.categoria?.toLowerCase().includes(q) ||
          r.sabor.toLowerCase().includes(q)
        )
      : recetasFiltradas
    return soloDisponibles && faltanPorReceta
      ? base.filter((r) => faltanPorReceta.get(r.id) === 0)
      : base
  }, [recetasFiltradas, q, soloDisponibles, faltanPorReceta])

  const [visibles, setVisibles] = useState(POR_TANDA)
  const centinela = useRef<HTMLDivElement>(null)

  // Cada cambio de filtros empieza otra vez por arriba. En el render y no en un
  // efecto: así no se llega a pintar la tanda vieja sobre los resultados nuevos.
  const [resultadosPrevios, setResultadosPrevios] = useState(resultados)
  if (resultadosPrevios !== resultados) {
    setResultadosPrevios(resultados)
    setVisibles(POR_TANDA)
  }

  // Se pinta la tanda siguiente cuando el final se acerca a la pantalla. Por
  // scroll y no con IntersectionObserver: el observer no dispara en algunos
  // navegadores embebidos y el catálogo se quedaría clavado en la primera tanda.
  useEffect(() => {
    if (visibles >= resultados.length) return
    let pedido = false
    const comprobar = () => {
      pedido = false
      const arriba = centinela.current?.getBoundingClientRect().top
      if (arriba != null && arriba < window.innerHeight + 800) setVisibles((v) => v + POR_TANDA)
    }
    const alScroll = () => {
      if (pedido) return
      pedido = true
      requestAnimationFrame(comprobar)
    }
    comprobar() // por si la tanda actual no llena ni la pantalla
    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', alScroll)
    return () => {
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', alScroll)
    }
  }, [visibles, resultados.length])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={cargar} />

  return (
    <div className="flex flex-col gap-8">
      {recetas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-orange-300 dark:text-orange-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="15" y2="7" />
              <line x1="9" y1="11" x2="13" y2="11" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Organiza tus recetas y planifica la compra</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-xs mx-auto">Añade tu primera receta para empezar a construir tu recetario.</p>
          <motion.button
            onClick={() => navigate('/recetas/nueva')}
            className="px-5 py-2.5 text-sm font-semibold bg-orange-700 dark:bg-orange-600 text-white rounded-xl hover:bg-orange-800 dark:hover:bg-orange-700 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            + Nueva receta
          </motion.button>
        </div>
      ) : (
        <>
          {mostrarAbanico && (
            <AbanicoRecetas
              recetas={hoy}
              faltanPorReceta={faltanPorReceta}
              titulo={tituloAbanico}
              onOpen={(id) => navigate(`/recetas/${id}`)}
              onToggleFavorita={toggleFavorita}
              onNueva={() => navigate('/recetas/nueva')}
            />
          )}

          {q && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{resultados.length}</span>
              {resultados.length === 1 ? ' resultado' : ' resultados'} para{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">"{searchParams.get('q')}"</span>
              {' — '}
              <button onClick={() => navigate('/')} className="text-orange-700 dark:text-orange-400 hover:underline">limpiar</button>
            </p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <FiltroBar filtros={filtros} categorias={categorias} ingredientes={ingredientesUnicos} onChange={setFiltros} />
              {conDespensa && (
                <button
                  onClick={() => setSoloDisponibles((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                    soloDisponibles
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Solo recetas con todos los ingredientes en la despensa"
                >
                  <span className={`w-2 h-2 rounded-full ${soloDisponibles ? 'bg-white' : 'bg-emerald-500'}`} />
                  Con lo que tenemos
                  {cocinablesHoy > 0 && (
                    <span className={`text-xs tabular-nums ${soloDisponibles ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {cocinablesHoy}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                className="px-3 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border-0 outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer"
                aria-label="Ordenar"
              >
                {ORDENES.map((o) => (
                  <option key={o.valor} value={o.valor}>Ordenar: {o.label}</option>
                ))}
              </select>

              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                <motion.button
                  onClick={() => cargarAleatorias(resultados.filter((r) => (r.tipo ?? 'principal') === 'principal'), 5, racionesAzar)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  title="Añade 5 recetas al azar a la lista"
                >
                  <Dices className="w-4 h-4" />
                  Sorpréndeme
                </motion.button>
                <div className="flex items-center gap-1 px-2 border-l border-gray-200 dark:border-gray-700">
                  <button onClick={() => setRacionesAzar((r) => Math.max(1, r - 1))} className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm leading-none" aria-label="Menos raciones">−</button>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-center tabular-nums">{racionesAzar} rac.</span>
                  <button onClick={() => setRacionesAzar((r) => Math.min(6, r + 1))} className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm leading-none" aria-label="Más raciones">+</button>
                </div>
              </div>
            </div>
          </div>

          {resultados.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {soloDisponibles
                  ? 'Ninguna receta cuadra con lo que tenéis en la despensa ahora mismo.'
                  : 'Sin resultados para estos filtros.'}
              </p>
              <button
                onClick={limpiarTodo}
                className="px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                Quitar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {resultados.slice(0, visibles).map((receta, i) => (
                    <RecetaCard
                      key={receta.id}
                      receta={receta}
                      index={i}
                      onClick={abrirReceta}
                      onToggleFavorita={toggleFavorita}
                      faltan={faltanPorReceta?.get(receta.id)}
                      onToggleLista={toggleReceta}
                      enLista={estaSeleccionada(receta.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {visibles < resultados.length && (
                <div ref={centinela} className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibles((v) => v + POR_TANDA)}
                    className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
                  >
                    Ver más recetas
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Catalogo
