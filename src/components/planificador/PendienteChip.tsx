import { useDraggable } from '@dnd-kit/core'
import type { PendientePlan } from '../../context/PendientesPlanContext'
import { SABOR_STRIP } from './estilos'

interface PendienteChipProps {
  pendiente: PendientePlan
  onElegirDia: () => void
  onDescartar: () => void
  overlay?: boolean
}

export default function PendienteChip({ pendiente, onElegirDia, onDescartar, overlay = false }: PendienteChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pendiente:${pendiente.receta.id}`,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging && !overlay ? 0.3 : 1 }}
      className={`relative flex items-center gap-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl pr-3 py-2 select-none touch-none cursor-grab active:cursor-grabbing overflow-hidden ${
        overlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm dark:shadow-none'
      }`}
    >
      <div className={`self-stretch w-[3px] shrink-0 ${SABOR_STRIP[pendiente.receta.sabor]}`} />
      <button onClick={onElegirDia} className="min-w-0 flex-1 text-left" aria-label={`Planificar ${pendiente.receta.nombre}`}>
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
          {pendiente.receta.nombre}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
          {pendiente.raciones} {pendiente.raciones === 1 ? 'ración' : 'raciones'}
        </p>
      </button>
      <button
        onClick={onDescartar}
        className="relative shrink-0 ml-1.5 text-gray-500 hover:text-red-400 transition-colors text-base leading-none after:content-[''] after:absolute after:-inset-y-1.5 after:-inset-x-2"
        aria-label="Descartar pendiente"
      >
        ×
      </button>
    </div>
  )
}
