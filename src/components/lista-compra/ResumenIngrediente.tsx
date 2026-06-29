import { motion } from 'framer-motion'

interface IngredienteAgrupado {
  nombre: string
  cantidad: number
  unidad: string
  familia: string
}

interface Props {
  ingrediente: IngredienteAgrupado
  checked: boolean
  onToggle: () => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ResumenIngrediente({ ingrediente, checked, onToggle }: Props) {
  const { nombre, cantidad, unidad } = ingrediente

  return (
    <motion.li
      className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 cursor-pointer select-none transition-opacity ${checked ? 'opacity-40' : ''}`}
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
    >
      <span className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
        checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
      }`}>
        {checked && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <span className={`flex-1 font-medium text-gray-800 ${checked ? 'line-through' : ''}`}>
        {capitalize(nombre)}
      </span>
      <span className="text-sm font-bold text-orange-600 tabular-nums shrink-0">
        {cantidad} {unidad}
      </span>
    </motion.li>
  )
}

export default ResumenIngrediente
