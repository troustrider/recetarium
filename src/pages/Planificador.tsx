import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, ChefHat, Salad } from 'lucide-react'
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
import { useRecetasContext, usePendientesPlan, useDeshacer } from '../context'
import { useDespensa } from '../context/DespensaContext'
import type { PendientePlan } from '../context/PendientesPlanContext'
import { consumoAlCocinar, type ConsumoIngrediente } from '../utils/consumo'
import { faltantes } from '../utils/despensa'
import { formatCantidad } from '../utils/ingredientes'
import type { RecetaListada, Sabor } from '../types/receta'

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

interface ChipProps {
  entrada: EntradaPlan
  dia: Dia
  onQuitar: () => void
  onRaciones: (n: number) => void
  onCocinar: () => void
  onGuarnicion: (conGuarnicion: boolean) => void
  overlay?: boolean
}

function RecetaChip({ entrada, onQuitar, onRaciones, onCocinar, onGuarnicion, overlay = false }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entrada.id,
    data: { entradaId: entrada.id },
  })
  const hecha = entrada.cocinada === true

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging && !overlay ? 0.3 : 1 }}
      className={`relative flex items-center gap-2 border rounded-xl pr-3 py-2 select-none min-w-0 max-w-full overflow-hidden ${
        hecha
          ? 'bg-white dark:bg-gray-800 border-dashed border-emerald-300 dark:border-emerald-800'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      } ${overlay ? 'shadow-2xl rotate-1 scale-105' : 'shadow-sm dark:shadow-none'}`}
    >
      {/* Franja de sabor. Va pegada al canto y a toda altura: es lo que hace que
          una semana llena se lea de un vistazo como un calendario y no como una
          lista. Ocupa el sitio del padding izquierdo, así que no ensancha el chip. */}
      <div className={`self-stretch w-[3px] shrink-0 ${hecha ? 'bg-emerald-400' : SABOR_STRIP[entrada.receta.sabor]}`} />

      {/* Handle de drag */}
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

      {/* Hecha. Va al principio, como la casilla de una lista de tareas: es el
          estado del plato, se lee antes que nada y queda lejos del stepper y de
          la ×, que es donde un toque de más duele. */}
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

      {/* Guarnición. Solo aparece si la receta trae una: es lo que decide si sus
          ingredientes entran en la compra y se gastan de la despensa. */}
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

      {/* Info */}
      {/* El nombre es lo único elástico del chip: el resto son controles de ancho fijo.
          El suelo evita que en una pantalla estrecha se quede en una letra y puntos. */}
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

      {/* Stepper raciones. El área pulsable se amplía con pseudo-elemento y no con
          padding: en móvil el chip ya va justo de ancho y crecerlo desborda la fila. */}
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

      {/* Quitar. El margen extra separa su zona de toque de la del stepper: es la
          única acción destructiva del chip y no tiene deshacer. */}
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

interface ConfirmarCocinadaProps {
  entrada: EntradaPlan
  consumos: ConsumoIngrediente[]
  onConfirmar: (elegidos: ConsumoIngrediente[]) => void
  onCerrar: () => void
}

function ConfirmarCocinada({ entrada, consumos, onConfirmar, onCerrar }: ConfirmarCocinadaProps) {
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())

  const alternar = (nombre: string) =>
    setExcluidos((prev) => {
      const sig = new Set(prev)
      if (!sig.delete(nombre)) sig.add(nombre)
      return sig
    })

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
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
            Ya está hecha
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {entrada.receta.nombre} · {entrada.raciones} {entrada.raciones === 1 ? 'ración' : 'raciones'}
          </p>
        </div>

        {consumos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500">
            No hay nada de esta receta en la despensa que descontar.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {consumos.map((c) => {
              const activo = !excluidos.has(c.nombre)
              return (
                <li key={c.nombre}>
                  <button
                    onClick={() => alternar(c.nombre)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] font-bold ${
                        activo
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold truncate ${activo ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                        {c.nombre}
                      </span>
                      <span className="block text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
                        {c.usadoPor.join(', ')}
                      </span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-bold ${c.accion === 'quitar' ? 'text-red-400' : 'text-gray-400'}`}>
                      {c.accion === 'quitar' ? 'se acaba' : `quedan ${formatCantidad(c.cantidad!, c.unidad!)}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCerrar}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirmar(consumos.filter((c) => !excluidos.has(c.nombre))); onCerrar() }}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            Vaciar y marcar
          </button>
        </div>
      </motion.div>
    </>
  )
}

interface FilaDiaProps {
  dia: Dia
  entradas: EntradaPlan[]
  onAñadir: () => void
  onQuitar: (id: string) => void
  onRaciones: (id: string, n: number) => void
  onCocinar: (entrada: EntradaPlan) => void
  onGuarnicion: (id: string, conGuarnicion: boolean) => void
  isDragOver: boolean
}

function FilaDia({ dia, entradas, onAñadir, onQuitar, onRaciones, onCocinar, onGuarnicion, isDragOver }: FilaDiaProps) {
  const { setNodeRef } = useDroppable({ id: dia })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-start rounded-2xl border transition-colors p-4 min-h-[68px] ${
        isDragOver
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
          : 'bg-stone-100 dark:bg-gray-900 border-stone-200 dark:border-gray-800'
      }`}
    >
      {/* Etiqueta del día. En móvil va encima y no al lado: la columna le quitaba al chip
          los 64px que el chip necesita para no desbordar la fila. */}
      <div className="w-full sm:w-16 shrink-0 sm:pt-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {dia.slice(0, 3)}
        </p>
      </div>

      {/* Chips de recetas + botón añadir */}
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">
        <AnimatePresence>
          {entradas.map((entrada) => (
            <motion.div
              key={entrada.id}
              className="min-w-0 max-w-full"
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
                onCocinar={() => onCocinar(entrada)}
                onGuarnicion={(v) => onGuarnicion(entrada.id, v)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={onAñadir}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
        >
          + Añadir
        </button>
      </div>
    </div>
  )
}

interface SelectorProps {
  dia: Dia
  recetas: RecetaListada[]
  faltanPorReceta: Map<string, number> | null
  onSeleccionar: (receta: RecetaListada) => void
  onCerrar: () => void
}

function SelectorReceta({ dia, recetas, faltanPorReceta, onSeleccionar, onCerrar }: SelectorProps) {
  const [busqueda, setBusqueda] = useState('')
  const filtradas = useMemo(() => {
    const lista = recetas.filter((r) => r.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    if (!faltanPorReceta) return lista
    return [...lista].sort(
      (a, b) => (faltanPorReceta.get(a.id) ?? 99) - (faltanPorReceta.get(b.id) ?? 99)
    )
  }, [recetas, busqueda, faltanPorReceta])

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
            filtradas.map((receta) => {
              const faltan = faltanPorReceta?.get(receta.id)
              return (
                <motion.li key={receta.id} whileHover={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => { onSeleccionar(receta); onCerrar() }}
                  >
                    <div className={`w-1 h-8 rounded-full shrink-0 ${SABOR_STRIP[receta.sabor]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{receta.nombre}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{receta.categoria}</p>
                    </div>
                    {faltan != null && (
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          faltan === 0
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : faltan <= 3
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        {faltan === 0 ? 'la tenéis' : faltan === 1 ? 'falta 1' : `faltan ${faltan}`}
                      </span>
                    )}
                  </button>
                </motion.li>
              )
            })
          )}
        </ul>
      </motion.div>
    </>
  )
}

function Planificador() {
  const { plan, dias, añadir, quitar, setRaciones, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan } = usePlanificador()
  const { recetas } = useRecetasContext()
  const { pendientes, quitarPendiente, restaurarPendientes } = usePendientesPlan()
  const { despensa, consumir, restaurarDespensa } = useDespensa()
  const { registrar } = useDeshacer()
  const [selectorDia, setSelectorDia] = useState<Dia | null>(null)
  const [pendienteActiva, setPendienteActiva] = useState<PendientePlan | null>(null)
  const [cocinando, setCocinando] = useState<{ dia: Dia; entrada: EntradaPlan } | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragOverDia, setDragOverDia] = useState<Dia | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const totalRecetas = dias.reduce((acc, d) => acc + plan[d].length, 0)

  const faltanPorReceta = useMemo(
    () => (despensa.length === 0 ? null : new Map(recetas.map((r) => [r.id, faltantes(r, despensa).length]))),
    [recetas, despensa]
  )

  const consumos = useMemo(
    () => (cocinando ? consumoAlCocinar([cocinando.entrada], despensa) : []),
    [cocinando, despensa]
  )

  function alCocinar(dia: Dia, entrada: EntradaPlan) {
    if (entrada.cocinada) marcarCocinada(dia, entrada.id, false)
    else setCocinando({ dia, entrada })
  }

  function quitarConDeshacer(dia: Dia, entradaId: string) {
    const anterior = plan
    const entrada = plan[dia].find((e) => e.id === entradaId)
    quitar(dia, entradaId)
    registrar(
      entrada ? `Quitada ${entrada.receta.nombre}` : 'Receta quitada del plan',
      () => restaurarPlan(anterior)
    )
  }

  const pendienteDrag = activeDragId?.startsWith('pendiente:')
    ? pendientes.find((p) => `pendiente:${p.receta.id}` === activeDragId) ?? null
    : null

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
    if (entradaId.startsWith('pendiente:')) {
      const pendiente = pendientes.find((p) => `pendiente:${p.receta.id}` === entradaId)
      if (pendiente) añadir(hastaDia, pendiente.receta, pendiente.raciones)
      return
    }
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
            onClick={() => {
              const anterior = plan
              autollenar(recetas.filter((r) => (r.tipo ?? 'principal') === 'principal'), 2)
              registrar('Semana equilibrada', () => restaurarPlan(anterior))
            }}
            disabled={recetas.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
            whileTap={{ scale: 0.95 }}
            title="Siete platos que reparten la verdura y los micronutrientes, con su guarnición puesta"
          >
            <Dices className="w-3.5 h-3.5" />
            Auto-semana
          </motion.button>
          {totalRecetas > 0 && (
            <motion.button
              onClick={() => {
                const anterior = plan
                limpiar()
                registrar('Semana vaciada', () => restaurarPlan(anterior))
              }}
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
                  onDescartar={() => {
                    const anterior = pendientes
                    quitarPendiente(pendiente.receta.id)
                    registrar(`Descartada ${pendiente.receta.nombre}`, () => restaurarPendientes(anterior))
                  }}
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
              onQuitar={(id) => quitarConDeshacer(dia, id)}
              onRaciones={(id, n) => setRaciones(dia, id, n)}
              onCocinar={(entrada) => alCocinar(dia, entrada)}
              onGuarnicion={(id, v) => setGuarnicionPlan(dia, id, v)}
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
              onCocinar={() => {}}
              onGuarnicion={() => {}}
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
            faltanPorReceta={faltanPorReceta}
            onSeleccionar={(receta) => añadir(selectorDia, receta)}
            onCerrar={() => setSelectorDia(null)}
          />
        )}
        {cocinando && (
          <ConfirmarCocinada
            entrada={cocinando.entrada}
            consumos={consumos}
            onConfirmar={(elegidos) => {
              const planAnterior = plan
              const despensaAnterior = despensa
              const { dia, entrada } = cocinando
              consumir(elegidos)
              marcarCocinada(dia, entrada.id, true)
              registrar(`Hecha ${entrada.receta.nombre}`, () => {
                restaurarDespensa(despensaAnterior)
                restaurarPlan(planAnterior)
              })
            }}
            onCerrar={() => setCocinando(null)}
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
