import type { Ingrediente } from '../../types/receta'
import { formatCantidad, canonUnidad } from '../../utils/ingredientes'

interface Props {
  ingrediente: Ingrediente
  multiplicador?: number
  onRemove?: () => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function IngredienteItem({ ingrediente, multiplicador = 1, onRemove }: Props) {
  const { nombre, cantidad, unidad } = ingrediente
  const cantidadFinal = cantidad * multiplicador

  return (
    <li className="flex items-baseline gap-2 py-2.5 group">
      <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">{capitalize(nombre)}</span>
      <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 min-w-8 translate-y-[-3px]" />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums shrink-0 tracking-tight">
        {formatCantidad(cantidadFinal, canonUnidad(nombre, unidad))}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 self-center ml-1 w-7 h-7 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-lg leading-none"
          aria-label={`Eliminar ${nombre}`}
        >
          ×
        </button>
      )}
    </li>
  )
}

export default IngredienteItem
