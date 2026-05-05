import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRecetasContext } from '../context'
import useReceta from '../hooks/useReceta'
import IngredienteItem from '../components/recetas/IngredienteItem'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import type { Sabor } from '../types/receta'

const SABOR_BG: Record<Sabor, string> = {
  salado: '#041524',  // abismo oceánico
  dulce:  '#2d0412',  // cereza macerada
  amargo: '#180d00',  // fondo de taza
  umami:  '#100820',  // tierra de trufas
}

const BASE_COMENSALES = 2

function DetalleReceta() {
  const { id } = useParams<{ id: string }>()
  const { eliminar, toggleFavorita } = useRecetasContext()
  const { receta, loading, error } = useReceta(id!)
  const navigate = useNavigate()
  const [comensales, setComensales] = useState(BASE_COMENSALES)

  const ingredientesPorFamilia = useMemo(() => {
    if (!receta) return []
    const mapa = new Map<string, typeof receta.ingredientes>()
    for (const ing of receta.ingredientes) {
      const familia = ing.familia || 'Otros'
      if (!mapa.has(familia)) mapa.set(familia, [])
      mapa.get(familia)!.push(ing)
    }
    return [...mapa.entries()]
  }, [receta])

  if (loading) return <LoadingSpinner />
  if (error || !receta) return <ErrorMessage message={error ?? 'Receta no encontrada'} />

  async function handleEliminar() {
    if (!confirm(`¿Eliminar "${receta!.nombre}"?`)) return
    const ok = await eliminar(receta!.id)
    if (ok) navigate('/')
  }

  const multiplicador = comensales / BASE_COMENSALES

  return (
    <div className="flex flex-col gap-8">
      {/* Header con imagen opcional */}
      {receta.imagen ? (
        <div className="relative h-56 rounded-2xl overflow-hidden">
          <img
            src={receta.imagen}
            alt={receta.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
              {[receta.categoria, receta.sabor, `${receta.tiempoPreparacion} min`].filter(Boolean).join(' / ')}
            </p>
            <h1 className="font-display text-3xl font-bold text-white leading-tight">{receta.nombre}</h1>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Header visual sin imagen — mismo lenguaje que las cards */}
          <div className="relative h-44 rounded-2xl overflow-hidden" style={{ backgroundColor: SABOR_BG[receta.sabor] }}>
            <span
              className="absolute top-1/2 -translate-y-1/2 left-5 font-display font-black leading-none select-none pointer-events-none whitespace-nowrap"
              style={{ fontSize: '96px', color: 'rgba(255,255,255,0.06)' }}
            >
              {receta.nombre}
            </span>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Favorito */}
            <motion.button
              onClick={() => toggleFavorita(receta.id)}
              className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-colors ${receta.favorita ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}`}
              aria-label={receta.favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
              whileTap={{ scale: 0.85 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
                fill={receta.favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
              </svg>
            </motion.button>
          </div>
          {/* Metadatos + título */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">
              {[receta.categoria, receta.sabor, `${receta.tiempoPreparacion} min`].filter(Boolean).join(' / ')}
            </p>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {receta.nombre}
            </h1>
          </div>
        </div>
      )}

      {/* Favorito cuando hay imagen — va encima del hero */}

      <div className="flex gap-2">
        <motion.button
          onClick={() => navigate(`/recetas/${receta.id}/editar`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-white transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
          Editar
        </motion.button>
        <motion.button
          onClick={handleEliminar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
          Eliminar
        </motion.button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100">Ingredientes</h2>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Personas</span>
            <motion.button
              onClick={() => setComensales((c) => Math.max(1, c - 1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 font-bold text-lg leading-none disabled:opacity-30"
              disabled={comensales <= 1}
              whileTap={{ scale: 0.85 }}
              aria-label="Reducir comensales"
            >
              −
            </motion.button>
            <span className="w-5 text-center text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {comensales}
            </span>
            <motion.button
              onClick={() => setComensales((c) => Math.min(12, c + 1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 font-bold text-lg leading-none disabled:opacity-30"
              disabled={comensales >= 12}
              whileTap={{ scale: 0.85 }}
              aria-label="Aumentar comensales"
            >
              +
            </motion.button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-4">
          {ingredientesPorFamilia.map(([familia, ingredientes]) => (
            <div key={familia}>
              {ingredientesPorFamilia.length > 1 && (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">
                  {familia}
                </p>
              )}
              <ul className="flex flex-col">
                {ingredientes.map((ing, i) => (
                  <IngredienteItem key={i} ingrediente={ing} multiplicador={multiplicador} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Pasos</h2>
        <ol className="flex flex-col gap-4">
          {receta.pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-4 text-sm">
              <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-orange-700 to-amber-600 text-white rounded-full text-xs font-bold shadow-sm">
                {i + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">{paso}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default DetalleReceta
