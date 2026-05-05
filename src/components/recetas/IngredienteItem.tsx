import type { Ingrediente } from '../../types/receta'

interface Props {
  ingrediente: Ingrediente
  multiplicador?: number
  onRemove?: () => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatCantidad(n: number): string {
  const r = Math.round(n * 100) / 100
  return r % 1 === 0 ? String(r) : r.toFixed(1)
}

function IngredienteItem({ ingrediente, multiplicador = 1, onRemove }: Props) {
  const { nombre, cantidad, unidad } = ingrediente
  const cantidadFinal = cantidad * multiplicador

  return (
    <li className="flex items-baseline gap-2 py-2.5 group">
      <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">{capitalize(nombre)}</span>
      <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 min-w-8 translate-y-[-3px]" />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums shrink-0 tracking-tight">
        {formatCantidad(cantidadFinal)} {unidad}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-lg leading-none ml-1"
          aria-label={`Eliminar ${nombre}`}
        >
          ×
        </button>
      )}
    </li>
  )
}

export default IngredienteItem
