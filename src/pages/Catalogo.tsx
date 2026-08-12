import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices } from 'lucide-react'
import { useRecetasContext } from '../context'
import { useListaCompraContext, useDespensa } from '../context'
import { faltantes } from '../utils/despensa'
import { normalizar } from '../utils/ingredientes'
import useFiltros, { type Orden } from '../hooks/useFiltros'
import type { Receta } from '../types/receta'
import RecetaCard from '../components/recetas/RecetaCard'
import AbanicoRecetas from '../components/recetas/AbanicoRecetas'
import IndiceAlfabetico from '../components/recetas/IndiceAlfabetico'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

const POR_TANDA = 24
const MAX_FALTAN = 3
const MIN_PARA_INDICE = 30

function inicialDe(nombre: string): string {
  const c = normalizar(nombre).charAt(0).toUpperCase()
  return c >= 'A' && c <= 'Z' ? c : '#'
}

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
    { valor: 'hierro', label: 'Más hierro' },
  ]

  function limpiarTodo() {
    setFiltros({ categoria: '', sabor: '', tiempoMax: '', ingrediente: '', sinGluten: false })
    setSoloDisponibles(false)
    if (searchParams.get('q')) navigate('/')
  }

  const q = searchParams.get('q')?.toLowerCase().trim() ?? ''
  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )

  const hayFiltrosActivos =
    !!q || soloDisponibles || filtros.categoria !== '' || filtros.sabor !== '' || filtros.tiempoMax !== '' || filtros.ingrediente !== '' || filtros.sinGluten

  const ingredientesUnicos = useMemo(
    () => [...new Set(recetas.flatMap((r) => r.ingredientes.map((i) => i.nombre.toLowerCase())))].sort(),
    [recetas]
  )

  const [seedAbanico] = useState(() => Math.floor(Math.random() * 2 ** 32))

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

  const candidatasAzar = useMemo(() => {
    const principales = resultados.filter((r) => (r.tipo ?? 'principal') === 'principal')
    if (!faltanPorReceta) return principales
    const cerca = principales.filter((r) => (faltanPorReceta.get(r.id) ?? 99) <= MAX_FALTAN)
    return cerca.length > 0 ? cerca : principales
  }, [resultados, faltanPorReceta])

  const [visibles, setVisibles] = useState(POR_TANDA)
  const centinela = useRef<HTMLDivElement>(null)

  const [resultadosPrevios, setResultadosPrevios] = useState(resultados)
  if (resultadosPrevios !== resultados) {
    setResultadosPrevios(resultados)
    setVisibles(POR_TANDA)
  }

  // Índice alfabético: solo tiene sentido cuando el orden es el nombre y hay
  // catálogo suficiente como para que desplazarse a mano canse.
  const secciones = useMemo(() => {
    if (orden !== 'nombre' || resultados.length < MIN_PARA_INDICE) return null
    const m = new Map<string, number>()
    resultados.forEach((r, i) => {
      const letra = inicialDe(r.nombre)
      if (!m.has(letra)) m.set(letra, i)
    })
    return m.size > 1 ? m : null
  }, [resultados, orden])

  const [letraActiva, setLetraActiva] = useState<string | null>(null)

  // flushSync para que la tanda ampliada esté ya en el DOM antes de buscar el
  // encabezado. El salto es sin animación: con 268 recetas el scroll suave
  // tarda segundos.
  const irALetra = useCallback(
    (letra: string) => {
      const i = secciones?.get(letra)
      if (i == null) return
      flushSync(() => setVisibles((v) => (i < v ? v : Math.ceil((i + 1) / POR_TANDA) * POR_TANDA)))
      document.getElementById(`letra-${letra}`)?.scrollIntoView({ block: 'start' })
    },
    [secciones]
  )

  useEffect(() => {
    if (!secciones) return
    let pedido = false
    const calcular = () => {
      pedido = false
      const cabeceras = document.querySelectorAll<HTMLElement>('[data-letra]')
      let actual: string | null = cabeceras[0]?.dataset.letra ?? null
      for (const h of cabeceras) {
        if (h.getBoundingClientRect().top > 140) break
        actual = h.dataset.letra ?? actual
      }
      setLetraActiva(actual)
    }
    const alScroll = () => {
      if (pedido) return
      pedido = true
      requestAnimationFrame(calcular)
    }
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [secciones, visibles])

  type Elemento =
    | { tipo: 'letra'; letra: string }
    | { tipo: 'receta'; receta: Receta; index: number }

  const elementos = useMemo<Elemento[]>(() => {
    const tanda = resultados.slice(0, visibles)
    const salida: Elemento[] = []
    let previa = ''
    tanda.forEach((receta, index) => {
      if (secciones) {
        const letra = inicialDe(receta.nombre)
        if (letra !== previa) salida.push({ tipo: 'letra', letra })
        previa = letra
      }
      salida.push({ tipo: 'receta', receta, index })
    })
    return salida
  }, [resultados, visibles, secciones])

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
                  onClick={() => cargarAleatorias(candidatasAzar, 5, racionesAzar)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  whileTap={{ scale: 0.95 }}
                  title={
                    conDespensa
                      ? `Añade 5 recetas a las que no os falten más de ${MAX_FALTAN} ingredientes`
                      : 'Añade 5 recetas al azar a la lista'
                  }
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
                  {elementos.map((el) =>
                    el.tipo === 'letra' ? (
                      <div
                        key={`letra-${el.letra}`}
                        id={`letra-${el.letra}`}
                        data-letra={el.letra}
                        className="col-span-full sticky z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-1
                                   top-[calc(env(safe-area-inset-top)+4rem)]
                                   scroll-mt-[calc(env(safe-area-inset-top)+5rem)]
                                   bg-stone-50/85 dark:bg-gray-950/85 backdrop-blur-sm"
                      >
                        <span className="font-display text-sm font-bold tracking-[0.2em] text-orange-600 dark:text-orange-400">
                          {el.letra}
                        </span>
                      </div>
                    ) : (
                      <RecetaCard
                        key={el.receta.id}
                        receta={el.receta}
                        index={el.index}
                        onClick={abrirReceta}
                        onToggleFavorita={toggleFavorita}
                        faltan={faltanPorReceta?.get(el.receta.id)}
                        onToggleLista={toggleReceta}
                        enLista={estaSeleccionada(el.receta.id)}
                      />
                    )
                  )}
                </AnimatePresence>
              </div>
              {secciones && (
                <IndiceAlfabetico
                  letras={[...secciones.keys()]}
                  activa={letraActiva}
                  onSeleccionar={irALetra}
                />
              )}
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
