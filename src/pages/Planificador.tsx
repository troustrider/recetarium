import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, SlidersHorizontal } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { usePlanificador, type Dia, type EntradaPlan, type InformeSemana } from '../context/PlanificadorContext'
import { useRecetasContext, usePendientesPlan, useDeshacer, usePreferencias } from '../context'
import { useDespensa } from '../context/DespensaContext'
import PanelSemana from '../components/planificador/PanelSemana'
import ResumenSemana from '../components/planificador/ResumenSemana'
import RecetaChip from '../components/planificador/RecetaChip'
import PendienteChip from '../components/planificador/PendienteChip'
import SelectorDia from '../components/planificador/SelectorDia'
import SelectorReceta from '../components/planificador/SelectorReceta'
import ConfirmarCocinada from '../components/planificador/ConfirmarCocinada'
import FilaDia from '../components/planificador/FilaDia'
import type { PendientePlan } from '../context/PendientesPlanContext'
import { consumoAlCocinar } from '../utils/consumo'
import { faltantes } from '../utils/despensa'
import useTitulo from '../hooks/useTitulo'

function Planificador() {
  useTitulo('Planificador')
  const { plan, dias, añadir, quitar, setRaciones, setMomento, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan } = usePlanificador()
  const { recetas } = useRecetasContext()
  const { pendientes, quitarPendiente, restaurarPendientes } = usePendientesPlan()
  const { despensa, consumir, restaurarDespensa } = useDespensa()
  const { registrar } = useDeshacer()
  const { preferencias } = usePreferencias()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [informe, setInforme] = useState<InformeSemana | null>(null)
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

  // Las cocinas que de verdad hay en el catálogo, de la más surtida a la que
  // menos: elegir como favorita una de la que solo hay dos platos no llena nada.
  const cocinas = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const receta of recetas) {
      if (!receta.categoria) continue
      cuenta.set(receta.categoria, (cuenta.get(receta.categoria) ?? 0) + 1)
    }
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c)
  }, [recetas])

  const recetasDelPlan = useMemo(
    () => dias.flatMap((d) => plan[d].map((e) => e.receta)),
    [dias, plan]
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 mb-1">Semana</p>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Planificador</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <motion.button
            onClick={() => setPanelAbierto(true)}
            className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.95 }}
            title="Qué buscamos esta semana, cuántos desayunos y qué no entra"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Cómo comemos
          </motion.button>
          <motion.button
            onClick={() => {
              const anterior = plan
              setInforme(autollenar(recetas, 2, despensa))
              registrar('Semana equilibrada', () => {
                restaurarPlan(anterior)
                setInforme(null)
              })
            }}
            disabled={recetas.length === 0}
            className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
            whileTap={{ scale: 0.95 }}
            title="Rellena los huecos libres —cenas, y los desayunos y comidas que hayas pedido— repartiendo verdura, macros y micronutrientes, con su guarnición puesta. Prefiere los platos que gastan lo que hay en casa, empezando por lo abierto y lo que caduca. Lo que ya has marcado como hecho se queda y cuenta para el reparto"
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
              className="whitespace-nowrap text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              Limpiar semana
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {informe && (
          <ResumenSemana
            key="resumen"
            recetas={recetasDelPlan}
            preferencias={preferencias}
            informe={informe}
            onCerrar={() => setInforme(null)}
          />
        )}
      </AnimatePresence>

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
              onMomento={(id, m) => setMomento(dia, id, m)}
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
              onMomento={() => {}}
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
            onSeleccionar={(receta, momento) => añadir(selectorDia, receta, undefined, momento)}
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
        {panelAbierto && (
          <PanelSemana cocinas={cocinas} onCerrar={() => setPanelAbierto(false)} />
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
