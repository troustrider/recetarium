import type { Ingrediente } from '../../types/receta'

interface Props {
  ingrediente: Ingrediente
  onRemove?: () => void
}

function IngredienteItem({ ingrediente, onRemove }: Props) {
  const { nombre, cantidad, unidad } = ingrediente

  return (
    <li className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-800">{nombre}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {cantidad} {unidad}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
            aria-label={`Eliminar ${nombre}`}
          >
            ×
          </button>
        )}
      </div>
    </li>
  )
}

export default IngredienteItem
