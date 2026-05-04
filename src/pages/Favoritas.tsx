import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecetasContext } from '../context'
import useFiltros from '../hooks/useFiltros'
import RecetaCard from '../components/recetas/RecetaCard'
import FiltroBar from '../components/shared/FiltroBar'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

function Favoritas() {
  const { recetas, loading, error, cargar, toggleFavorita } = useRecetasContext()
  const favoritas = recetas.filter((r) => r.favorita)
  const { filtros, setFiltros, recetasFiltradas } = useFiltros(favoritas)
  const navigate = useNavigate()

  const categorias = useMemo(
    () => [...new Set(favoritas.map((r) => r.categoria))].filter(Boolean).sort(),
    [favoritas]
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={cargar} />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Favoritas</h1>

      {favoritas.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-5 text-gray-200" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
          </svg>
          <h2 className="font-display text-lg font-bold text-gray-700 mb-1">Todavía no tienes favoritas</h2>
          <p className="text-sm text-gray-400 mb-6">Pulsa el corazón en cualquier receta para guardarla aquí.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors"
          >
            Ir al catálogo
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
                <RecetaCard
                  key={receta.id}
                  receta={receta}
                  onClick={(id) => navigate(`/recetas/${id}`)}
                  onToggleFavorita={toggleFavorita}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Favoritas
