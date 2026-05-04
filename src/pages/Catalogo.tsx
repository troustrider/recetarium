import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecetasContext } from '../context'
import { useListaCompraContext } from '../context'
import useFiltros from '../hooks/useFiltros'
import RecetaCard from '../components/recetas/RecetaCard'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

function Catalogo() {
  const { recetas, loading, error, cargar, toggleFavorita } = useRecetasContext()
  const { toggleReceta, estaSeleccionada } = useListaCompraContext()
  const { filtros, setFiltros, recetasFiltradas } = useFiltros(recetas)
  const navigate = useNavigate()

  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={cargar} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">Catálogo</h1>
        <button
          onClick={() => navigate('/recetas/nueva')}
          className="px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors shrink-0"
        >
          + Nueva receta
        </button>
      </div>

      {recetas.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-5 text-gray-200" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="13" y2="11" />
          </svg>
          <h2 className="font-display text-lg font-bold text-gray-800 mb-1">Organiza tus recetas y planifica la compra</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Añade tu primera receta para empezar a construir tu recetario.</p>
          <button
            onClick={() => navigate('/recetas/nueva')}
            className="px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors"
          >
            + Nueva receta
          </button>
        </div>
      ) : (
        <>
          <FiltroBar filtros={filtros} categorias={categorias} onChange={setFiltros} />

          {recetasFiltradas.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Sin resultados para estos filtros.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recetasFiltradas.map((receta) => (
                <div key={receta.id} className="relative">
                  <RecetaCard
                    receta={receta}
                    onClick={(id) => navigate(`/recetas/${id}`)}
                    onToggleFavorita={toggleFavorita}
                  />
                  <button
                    onClick={() => toggleReceta(receta)}
                    className={`absolute bottom-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      estaSeleccionada(receta.id)
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-teal-400'
                    }`}
                  >
                    {estaSeleccionada(receta.id) ? '✓ En lista' : '+ Lista'}
                  </button>
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
