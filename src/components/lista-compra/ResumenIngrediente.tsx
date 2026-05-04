interface IngredienteAgrupado {
  nombre: string
  cantidad: number
  unidad: string
  familia: string
}

interface Props {
  ingrediente: IngredienteAgrupado
}

function ResumenIngrediente({ ingrediente }: Props) {
  const { nombre, cantidad, unidad, familia } = ingrediente

  return (
    <li className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{familia}</span>
        <span className="text-gray-800">{nombre}</span>
      </div>
      <span className="text-sm text-gray-500 shrink-0">
        {cantidad} {unidad}
      </span>
    </li>
  )
}

export default ResumenIngrediente
