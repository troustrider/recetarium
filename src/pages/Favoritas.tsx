import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecetasContext } from '../context'
import useFiltros from '../hooks/useFiltros'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import RecetaCard from '../components/recetas/RecetaCard'

function Favoritas() {
  const { recetas, loading, error, cargar, toggleFavorita } = useRecetasContext()
  const favoritas = recetas.filter((r) => r.favorita)
  const { filtros, setFiltros, recetasFiltradas } = useFiltros(favoritas)
  const navigate = useNavigate()

  const abrirReceta = useCallback((id: string) => navigate(`/recetas/${id}`), [navigate])

  const categorias = useMemo(
    () => [...new Set(favoritas.map((r) => r.categoria))].filter(Boolean).sort(),
    [favoritas]
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={cargar} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-amber-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 dark:text-amber-500 mb-1">Mi colección</p>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Favoritas</h1>
        </div>
        {favoritas.length > 0 && (
          <span className="px-3 py-1 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            {favoritas.length}
          </span>
        )}
      </div>

      {favoritas.length === 0 ? (
        <div className="text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-amber-100 dark:bg-amber-900/30 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 rounded-3xl -rotate-3 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-amber-300" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
              </svg>
            </div>
          </div>
          <h2 className="font-display text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">Tu colección está vacía</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Marca recetas como favoritas para guardarlas aquí.</p>
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-sm font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            Explorar catálogo
          </motion.button>
        </div>
      ) : (
        <>
          <FiltroBar filtros={filtros} categorias={categorias} onChange={setFiltros} />
          {recetasFiltradas.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Sin resultados para estos filtros.</p>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2">
                {recetasFiltradas.map((receta) => (
                  <RecetaCard
                    key={receta.id}
                    receta={receta}
                    onClick={abrirReceta}
                    onToggleFavorita={toggleFavorita}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}

export default Favoritas
