import type { Sabor } from '../../types/receta'
import type { Filtros } from '../../hooks/useFiltros'

const SABORES: Sabor[] = ['salado', 'dulce', 'amargo', 'umami']

interface Props {
  filtros: Filtros
  categorias: string[]
  onChange: (filtros: Filtros) => void
}

function FiltroBar({ filtros, categorias, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {categorias.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(['', ...categorias] as string[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...filtros, categoria: c })}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize ${
                filtros.categoria === c
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {c === '' ? 'Todas' : c}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['', ...SABORES] as Array<Sabor | ''>).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ ...filtros, sabor: s })}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize ${
              filtros.sabor === s
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            {s === '' ? 'Todos' : s}
          </button>
        ))}
      </div>
    </div>
  )
}

export type { Filtros }
export default FiltroBar
