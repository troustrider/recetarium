import { useParams, useNavigate } from 'react-router-dom'
import { useRecetasContext } from '../context'
import useReceta from '../hooks/useReceta'
import IngredienteItem from '../components/recetas/IngredienteItem'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

function DetalleReceta() {
  const { id } = useParams<{ id: string }>()
  const { eliminar, toggleFavorita } = useRecetasContext()
  const { receta, loading, error } = useReceta(id!)
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner />
  if (error || !receta) return <ErrorMessage message={error ?? 'Receta no encontrada'} />

  async function handleEliminar() {
    if (!confirm(`¿Eliminar "${receta!.nombre}"?`)) return
    const ok = await eliminar(receta!.id)
    if (ok) navigate('/')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{receta.nombre}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {receta.categoria && (
              <span className="px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full capitalize">{receta.categoria}</span>
            )}
            <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full capitalize">{receta.sabor}</span>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">{receta.tiempoPreparacion} min</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toggleFavorita(receta.id)}
            className={`transition-colors ${receta.favorita ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}
            aria-label={receta.favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
              fill={receta.favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
            </svg>
          </button>
          <button
            onClick={() => navigate(`/recetas/${receta.id}/editar`)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleEliminar}
            className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      <section>
        <h2 className="font-display text-base font-bold text-gray-800 mb-3">Ingredientes</h2>
        <ul className="border border-gray-100 rounded-xl px-3">
          {receta.ingredientes.map((ing, i) => (
            <IngredienteItem key={i} ingrediente={ing} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base font-bold text-gray-800 mb-3">Pasos</h2>
        <ol className="flex flex-col gap-3">
          {receta.pasos.map((paso, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-gray-700 leading-relaxed">{paso}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default DetalleReceta
