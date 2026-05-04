import type { Receta } from '../../types/receta'

interface Props {
  receta: Receta
  onClick: (id: string) => void
  onToggleFavorita: (id: string) => void
}

function RecetaCard({ receta, onClick, onToggleFavorita }: Props) {
  const { id, nombre, categoria, sabor, tiempoPreparacion, favorita } = receta

  return (
    <article
      className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => onClick(id)}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-display font-bold text-gray-900 text-base leading-snug group-hover:text-teal-700 transition-colors">
          {nombre}
        </h3>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorita(id) }}
          className={`shrink-0 transition-colors ${favorita ? 'text-red-400' : 'text-gray-200 hover:text-red-300'}`}
          aria-label={favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
            fill={favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categoria && (
            <span className="px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full capitalize">
              {categoria}
            </span>
          )}
          <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full capitalize">
            {sabor}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium shrink-0">{tiempoPreparacion} min</span>
      </div>
    </article>
  )
}

export default RecetaCard
