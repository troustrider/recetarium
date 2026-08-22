import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChefHat, Salad } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { Dia, EntradaPlan } from '../../context/PlanificadorContext'
import { NOMBRE_MOMENTO, momentoDe, siguienteMomento, type Momento } from '../../utils/momentos'
import { MOMENTO_ESTILO, SABOR_STRIP, SABOR_TEXT } from './estilos'

interface ChipProps {
  entrada: EntradaPlan
  dia: Dia
  onQuitar: () => void
  onRaciones: (n: number) => void
  onCocinar: () => void
  onGuarnicion: (conGuarnicion: boolean) => void
  onMomento: (momento: Momento) => void
  overlay?: boolean
}

export default function RecetaChip({ entrada, onQuitar, onRaciones, onCocinar, onGuarnicion, onMomento, overlay = false }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entrada.id,
    data: { entradaId: entrada.id },
  })
  const hecha = entrada.cocinada === true
  const momento = momentoDe(entrada)
  const estilo = MOMENTO_ESTILO[momento]

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging && !overlay ? 0.3 : 1 }}
      className={`relative flex items-center gap-2 border rounded-xl pr-3 py-2 select-none min-w-0 max-w-full overflow-hidden ${
        // Lo cocinado manda sobre el momento: el verde de "ya está hecha" es el
        // estado del plato de hoy, y el momento seguirá ahí mañana.
        hecha
          ? 'bg-white dark:bg-gray-800 border-dashed border-emerald-300 dark:border-emerald-800'
          : estilo.chip
      } ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm dark:shadow-none'}`}
    >
      <div className={`self-stretch w-[3px] shrink-0 ${hecha ? 'bg-emerald-400' : SABOR_STRIP[entrada.receta.sabor]}`} />

      <button
        {...listeners}
        {...attributes}
        className="relative shrink-0 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-none after:content-[''] after:absolute after:-inset-1.5"
        aria-label="Arrastrar"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" /><circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="8" r="1.5" /><circle cx="9" cy="8" r="1.5" />
          <circle cx="3" cy="13" r="1.5" /><circle cx="9" cy="13" r="1.5" />
        </svg>
      </button>

      <motion.button
        onClick={() => onMomento(siguienteMomento(momento))}
        aria-label={`${NOMBRE_MOMENTO[momento]}. Cambiar a ${NOMBRE_MOMENTO[siguienteMomento(momento)].toLowerCase()}`}
        title={`${NOMBRE_MOMENTO[momento]}: toca para pasarlo a ${NOMBRE_MOMENTO[siguienteMomento(momento)].toLowerCase()}`}
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${estilo.boton}`}
        whileTap={{ scale: 0.8 }}
      >
        <estilo.Icono className="w-3.5 h-3.5" />
      </motion.button>

      <button
        onClick={onCocinar}
        aria-pressed={hecha}
        aria-label={hecha ? 'Marcar como no cocinada' : 'Marcar como cocinada'}
        title={hecha ? 'Deshacer: vuelve a contar para la compra' : 'Ya la he cocinado: vacía sus ingredientes de la despensa'}
        className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
          hecha
            ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-400'
            : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-orange-400 hover:text-orange-400'
        }`}
      >
        <ChefHat className="w-3.5 h-3.5" />
      </button>

      {entrada.receta.guarnicion && (
        <button
          onClick={() => onGuarnicion(!entrada.conGuarnicion)}
          aria-pressed={!!entrada.conGuarnicion}
          aria-label={entrada.conGuarnicion ? 'Quitar la guarnición' : 'Añadir la guarnición'}
          title={
            entrada.conGuarnicion
              ? `Sin ${entrada.receta.guarnicion.nombre}: deja de contar para la compra`
              : `Con ${entrada.receta.guarnicion.nombre}: entra en la compra`
          }
          className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
            entrada.conGuarnicion
              ? 'bg-lime-500 border-lime-500 text-white hover:bg-lime-400'
              : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-lime-400 hover:text-lime-500'
          }`}
        >
          <Salad className="w-3.5 h-3.5" />
        </button>
      )}

      <Link to={`/recetas/${entrada.receta.id}`} className="min-w-[64px] flex-1 group">
        <p className={`text-xs font-semibold truncate max-w-[120px] transition-colors ${
          hecha
            ? 'text-gray-400 dark:text-gray-500 line-through'
            : 'text-gray-900 dark:text-gray-100 group-hover:text-orange-500 dark:group-hover:text-orange-400'
        }`}>
          {entrada.receta.nombre}
        </p>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${
          hecha ? 'text-emerald-500 dark:text-emerald-400' : SABOR_TEXT[entrada.receta.sabor]
        }`}>
          {hecha ? 'hecha' : entrada.receta.sabor}
        </p>
      </Link>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onRaciones(entrada.raciones - 1)}
          aria-label="Quitar una ración"
          className="relative w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none after:content-[''] after:absolute after:-inset-1.5"
        >
          −
        </button>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-4 text-center">
          {entrada.raciones}
        </span>
        <button
          onClick={() => onRaciones(entrada.raciones + 1)}
          aria-label="Añadir una ración"
          className="relative w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none after:content-[''] after:absolute after:-inset-1.5"
        >
          +
        </button>
      </div>

      <button
        onClick={onQuitar}
        className="relative shrink-0 ml-1.5 text-gray-500 hover:text-red-400 transition-colors text-base leading-none after:content-[''] after:absolute after:-inset-y-1.5 after:-inset-x-2"
        aria-label="Quitar receta"
      >
        ×
      </button>
    </div>
  )
}
