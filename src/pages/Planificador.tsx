import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { usePlanificador, type Dia, type EntradaPlan } from '../context/PlanificadorContext'
import { useRecetasContext, usePendientesPlan } from '../context'
import type { PendientePlan } from '../context/PendientesPlanContext'
import type { Receta, Sabor } from '../types/receta'

const SABOR_STRIP: Record<Sabor, string> = {
  salado: 'bg-sky-500',
  dulce:  'bg-rose-400',
  amargo: 'bg-amber-600',
  umami:  'bg-purple-500',
  acido:  'bg-lime-500',
}

const SABOR_TEXT: Record<Sabor, string> = {
  salado: 'text-sky-400',
  dulce:  'text-rose-400',
  amargo: 'text-amber-500',
  umami:  'text-purple-400',
  acido:  'text-lime-400',
}

// ——— Chip draggable ———
interface ChipProps {
  entrada: EntradaPlan
  dia: Dia
  onQuitar: () => void
  onRaciones: (n: number) => void
  overlay?: boolean
}

function RecetaChip({ entrada, onQuitar, onRaciones, overlay = false }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entrada.id,
    data: { entradaId: entrada.id },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging && !overlay ? 0.3 : 1 }}
      className={`flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 select-none ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm'}`}
    >
      {/* Handle de drag */}
      <button
        {...listeners}
        {...attributes}
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 transition-colors touch-none"
        aria-label="Arrastrar"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" /><circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="8" r="1.5" /><circle cx="9" cy="8" r="1.5" />
          <circle cx="3" cy="13" r="1.5" /><circle cx="9" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Franja de sabor */}
      <div className={`w-1 h-8 rounded-full shrink-0 ${SABOR_STRIP[entrada.receta.sabor]}`} />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
          {entrada.receta.nombre}
        </p>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${SABOR_TEXT[entrada.receta.sabor]}`}>
          {entrada.receta.sabor}
        </p>
      </div>

      {/* Stepper raciones */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onRaciones(entrada.raciones - 1)}
          className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none"
        >
          −
        </button>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 w-4 text-center">
          {entrada.raciones}
        </span>
        <button
          onClick={() => onRaciones(entrada.raciones + 1)}
          className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none"
        >
          +
        </button>
      </div>

      {/* Quitar */}
      <button
        onClick={onQuitar}
        className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-base leading-none"
        aria-label="Quitar receta"
      >
        ×
      </button>
    </div>
  )
}

// ——— Chip de receta comprada pendiente de planificar ———
interface PendienteChipProps {
  pendiente: PendientePlan
  onElegirDia: () => void
  onDescartar: () => void
  overlay?: boolean
}

function PendienteChip({ pendiente, onElegirDia, onDescartar, overlay = false }: PendienteChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pendiente:${pendiente.receta.id}`,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging && !overlay ? 0.3 : 1 }}
      className={`flex items-center gap-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 select-none touch-none cursor-grab active:cursor-grabbing ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm'}`}
    >
      <div className={`w-1 h-8 rounded-full shrink-0 ${SABOR_STRIP[pendiente.receta.sabor]}`} />
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
        className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-base leading-none"
        aria-label="Descartar pendiente"
      >
        ×
      </button>
    </div>
  )
}

// ——— Modal para elegir día de una pendiente ———
interface SelectorDiaProps {
  pendiente: PendientePlan
  dias: readonly Dia[]
  onSeleccionar: (dia: Dia) => void
  onCerrar: () => void
}

function SelectorDia({ pendiente, dias, onSeleccionar, onCerrar }: SelectorDiaProps) {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
      />
      <motion.div
        className="fixed inset-x-4 top-24 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            ¿Qué día cocinas <span className="text-gray-700 dark:text-gray-200">{pendiente.receta.nombre}</span>?
          </p>
        </div>
        <ul>
          {dias.map((dia) => (
            <motion.li key={dia} whileHover={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
              <button
                className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                onClick={() => { onSeleccionar(dia); onCerrar() }}
              >
                {dia}
              </button>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </>
  )
}

// ——— Fila de día droppable ———
interface FilaDiaProps {
  dia: Dia
  entradas: EntradaPlan[]
  onAñadir: () => void
  onQuitar: (id: string) => void
  onRaciones: (id: string, n: number) => void
  isDragOver: boolean
}

function FilaDia({ dia, entradas, onAñadir, onQuitar, onRaciones, isDragOver }: FilaDiaProps) {
  const { setNodeRef } = useDroppable({ id: dia })

  return (
    <div
      ref={setNodeRef}
      className={`flex gap-3 items-start bg-white dark:bg-gray-800 rounded-2xl border transition-colors p-4 min-h-[68px] ${
        isDragOver
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      {/* Etiqueta del día */}
      <div className="w-16 shrink-0 pt-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {dia.slice(0, 3)}
        </p>
      </div>

      {/* Chips de recetas + botón añadir */}
      <div className="flex flex-wrap gap-2 flex-1">
        <AnimatePresence>
          {entradas.map((entrada) => (
            <motion.div
              key={entrada.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              <RecetaChip
                entrada={entrada}
                dia={dia}
                onQuitar={() => onQuitar(entrada.id)}
                onRaciones={(n) => onRaciones(entrada.id, n)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={onAñadir}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
        >
          + Añadir
        </button>
      </div>
    </div>
  )
}

// ——— Modal selector ———
interface SelectorProps {
  dia: Dia
  recetas: Receta[]
  onSeleccionar: (receta: Receta) => void
  onCerrar: () => void
}

function SelectorReceta({ dia, recetas, onSeleccionar, onCerrar }: SelectorProps) {
  const [busqueda, setBusqueda] = useState('')
  const filtradas = recetas.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
      />
      <motion.div
        className="fixed inset-x-4 top-24 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Añadir al {dia}
          </p>
          <input
            type="text"
            placeholder="Buscar receta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-gray-100"
            autoFocus
          />
        </div>
        <ul className="max-h-72 overflow-y-auto">
          {filtradas.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados</li>
          ) : (
            filtradas.map((receta) => (
              <motion.li key={receta.id} whileHover={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => { onSeleccionar(receta); onCerrar() }}
                >
                  <div className={`w-1 h-8 rounded-full shrink-0 ${SABOR_STRIP[receta.sabor]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{receta.nombre}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{receta.categoria}</p>
                  </div>
                </button>
              </motion.li>
            ))
          )}
        </ul>
      </motion.div>
    </>
  )
}

// ——— Página principal ———
function Planificador() {
  const { plan, dias, añadir, quitar, setRaciones, mover, limpiar, autollenar } = usePlanificador()
  const { recetas } = useRecetasContext()
  const { pendientes, quitarPendiente } = usePendientesPlan()
  const [selectorDia, setSelectorDia] = useState<Dia | null>(null)
  const [pendienteActiva, setPendienteActiva] = useState<PendientePlan | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragOverDia, setDragOverDia] = useState<Dia | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const totalRecetas = dias.reduce((acc, d) => acc + plan[d].length, 0)

  const pendienteDrag = activeDragId?.startsWith('pendiente:')
    ? pendientes.find((p) => `pendiente:${p.receta.id}` === activeDragId) ?? null
    : null

  // Encontrar la entrada activa para el overlay
  const entradaActiva = activeDragId && !pendienteDrag
    ? (() => {
        for (const dia of dias) {
          const e = plan[dia].find((e) => e.id === activeDragId)
          if (e) return { entrada: e, dia }
        }
        return null
      })()
    : null

  function onDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function onDragOver(event: { over: { id: string } | null }) {
    const overId = event.over?.id as Dia | undefined
    setDragOverDia(overId && dias.includes(overId) ? overId : null)
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    setDragOverDia(null)
    const { active, over } = event
    if (!over) return
    const entradaId = active.id as string
    const hastaDia = over.id as Dia
    if (!dias.includes(hastaDia)) return
    // Pendiente de planificar soltada sobre un día
    if (entradaId.startsWith('pendiente:')) {
      const pendiente = pendientes.find((p) => `pendiente:${p.receta.id}` === entradaId)
      if (pendiente) añadir(hastaDia, pendiente.receta, pendiente.raciones)
      return
    }
    // Encontrar el día de origen
    for (const dia of dias) {
      if (plan[dia].some((e) => e.id === entradaId)) {
        mover(dia, hastaDia, entradaId)
        return
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 mb-1">Semana</p>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Planificador</h1>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => autollenar(recetas.filter((r) => (r.tipo ?? 'principal') === 'principal'), 2)}
            disabled={recetas.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
            whileTap={{ scale: 0.95 }}
            title="Rellena la semana con recetas al azar"
          >
            <Dices className="w-3.5 h-3.5" />
            Auto-semana
          </motion.button>
          {totalRecetas > 0 && (
            <motion.button
              onClick={limpiar}
              className="text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              Limpiar semana
            </motion.button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={onDragOver as never}
        onDragEnd={onDragEnd}
      >
        {pendientes.length > 0 && (
          <div className="mb-4 bg-emerald-50/70 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
              Compradas · por planificar
            </p>
            <p className="text-[11px] text-gray-400 mb-3">
              Arrástralas a un día o toca para elegirlo.
            </p>
            <div className="flex flex-wrap gap-2">
              {pendientes.map((pendiente) => (
                <PendienteChip
                  key={pendiente.receta.id}
                  pendiente={pendiente}
                  onElegirDia={() => setPendienteActiva(pendiente)}
                  onDescartar={() => quitarPendiente(pendiente.receta.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {dias.map((dia) => (
            <FilaDia
              key={dia}
              dia={dia}
              entradas={plan[dia]}
              onAñadir={() => setSelectorDia(dia)}
              onQuitar={(id) => quitar(dia, id)}
              onRaciones={(id, n) => setRaciones(dia, id, n)}
              isDragOver={dragOverDia === dia}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {entradaActiva && (
            <RecetaChip
              entrada={entradaActiva.entrada}
              dia={entradaActiva.dia}
              onQuitar={() => {}}
              onRaciones={() => {}}
              overlay
            />
          )}
          {pendienteDrag && (
            <PendienteChip
              pendiente={pendienteDrag}
              onElegirDia={() => {}}
              onDescartar={() => {}}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {selectorDia && (
          <SelectorReceta
            dia={selectorDia}
            recetas={recetas}
            onSeleccionar={(receta) => añadir(selectorDia, receta)}
            onCerrar={() => setSelectorDia(null)}
          />
        )}
        {pendienteActiva && (
          <SelectorDia
            pendiente={pendienteActiva}
            dias={dias}
            onSeleccionar={(dia) => añadir(dia, pendienteActiva.receta, pendienteActiva.raciones)}
            onCerrar={() => setPendienteActiva(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Planificador
