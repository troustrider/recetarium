import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dices } from 'lucide-react'
import { useRecetasContext } from '../context'
import { useListaCompraContext } from '../context'
import useFiltros, { type Orden } from '../hooks/useFiltros'
import RecetaCard from '../components/recetas/RecetaCard'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

function Catalogo() {
  const { recetas, loading, error, cargar, toggleFavorita } = useRecetasContext()
  const { toggleReceta, estaSeleccionada, cargarAleatorias } = useListaCompraContext()
  const { filtros, setFiltros, orden, setOrden, recetasFiltradas } = useFiltros(recetas)
  const [searchParams] = useSearchParams()
  const [racionesAzar, setRacionesAzar] = useState(2)
  const navigate = useNavigate()

  const ORDENES: { valor: Orden; label: string }[] = [
    { valor: 'nombre', label: 'Nombre' },
    { valor: 'tiempo', label: 'Más rápidas' },
    { valor: 'proteina', label: 'Más proteína' },
    { valor: 'precio', label: 'Más baratas' },
  ]

  const q = searchParams.get('q')?.toLowerCase().trim() ?? ''
  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )

  const resultados = useMemo(
    () =>
      q
        ? recetasFiltradas.filter((r) =>
            r.nombre.toLowerCase().includes(q) ||
            r.categoria?.toLowerCase().includes(q) ||
            r.sabor.toLowerCase().includes(q)
          )
        : recetasFiltradas,
    [recetasFiltradas, q]
  )

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
          {/* Hero banner */}
          <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: '#1c0f02' }}>
            {/* Grain / noise — textura premium sin gradiente */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" style={{ opacity: 0.13 }} aria-hidden="true">
              <filter id="hero-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#hero-grain)" />
            </svg>
            {/* Bloom naranja — foco de luz cálido en esquina superior derecha */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(234,88,12,0.28)_0%,transparent_55%)]" />
            {/* Número como watermark tipográfico */}
            <span
              className="absolute font-display font-black text-white select-none pointer-events-none leading-none"
              style={{ fontSize: '210px', opacity: 0.045, bottom: '-24px', right: '16px' }}
              aria-hidden="true"
            >
              {recetas.length}
            </span>
            <div className="relative z-10 flex items-end justify-between gap-6 px-8 py-10">
              <div>
                <p className="text-[11px] font-bold text-orange-400/60 uppercase tracking-[0.22em] mb-2">Tu recetario</p>
                <h1 className="font-display text-3xl font-bold text-white leading-tight">
                  {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'}<br />a tu alcance
                </h1>
              </div>
              <motion.button
                onClick={() => navigate('/recetas/nueva')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl transition-colors backdrop-blur-sm shrink-0"
                whileTap={{ scale: 0.97 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Nueva receta
              </motion.button>
            </div>
          </div>

          {q && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Resultados para <span className="font-semibold text-gray-800 dark:text-gray-200">"{searchParams.get('q')}"</span>
              {' — '}
              <button onClick={() => navigate('/')} className="text-orange-700 dark:text-orange-400 hover:underline">limpiar</button>
            </p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FiltroBar filtros={filtros} categorias={categorias} onChange={setFiltros} />

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
                  onClick={() => cargarAleatorias(resultados, 5, racionesAzar)}
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
            <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Sin resultados para estos filtros.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((receta) => (
                <div key={receta.id} className="relative">
                  <RecetaCard
                    receta={receta}
                    onClick={(id) => navigate(`/recetas/${id}`)}
                    onToggleFavorita={toggleFavorita}
                  />
                  <motion.button
                    onClick={() => toggleReceta(receta)}
                    className={`absolute bottom-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      estaSeleccionada(receta.id)
                        ? 'bg-orange-700 text-white shadow-sm'
                        : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:text-orange-700 dark:hover:border-orange-600 dark:hover:text-orange-400'
                    }`}
                    whileTap={{ scale: 0.93 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      {estaSeleccionada(receta.id) ? (
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      ) : (
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      )}
                    </svg>
                    {estaSeleccionada(receta.id) ? 'En lista' : 'Lista'}
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Catalogo
