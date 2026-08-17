import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { RecetaListada } from '../types/receta'
import { useListaCompraContext } from './ListaCompraContext'
import { useRecetasContext } from './RecetasContext'
import { usePendientesPlan } from './PendientesPlanContext'
import { getPlan, savePlan, type EntradaPlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { racionesBase } from '../hooks/useListaCompra'
import { semanaEquilibrada } from '../utils/semana'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export type Dia = typeof DIAS[number]

export interface EntradaPlan {
  id: string
  receta: RecetaListada
  raciones: number
  cocinada?: boolean
  conGuarnicion?: boolean
}

type Plan = Record<Dia, EntradaPlan[]>

const PLAN_VACIO: Plan = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan

function serializar(plan: Plan): EntradaPlanDTO[] {
  const out: EntradaPlanDTO[] = []
  for (const dia of DIAS) {
    for (const e of plan[dia]) {
      out.push({
        dia,
        recetaId: e.receta.id,
        raciones: e.raciones,
        ...(e.cocinada ? { cocinada: true } : {}),
        ...(e.conGuarnicion ? { conGuarnicion: true } : {}),
      })
    }
  }
  return out
}

function hidratar(dtos: EntradaPlanDTO[], recetas: RecetaListada[]): Plan {
  const byId = new Map(recetas.map((r) => [r.id, r]))
  const result = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
  for (const { dia, recetaId, raciones, cocinada, conGuarnicion } of dtos) {
    const receta = byId.get(recetaId)
    if (!receta || !DIAS.includes(dia as Dia)) continue
    result[dia as Dia].push({
      id: `${dia}-${recetaId}-${Date.now()}-${Math.random()}`,
      receta,
      raciones,
      ...(cocinada ? { cocinada: true } : {}),
      ...(conGuarnicion ? { conGuarnicion: true } : {}),
    })
  }
  return result
}

interface PlanificadorCtx {
  plan: Plan
  dias: readonly Dia[]
  añadir: (dia: Dia, receta: RecetaListada, raciones?: number) => void
  quitar: (dia: Dia, entradaId: string) => void
  setRaciones: (dia: Dia, entradaId: string, raciones: number) => void
  setGuarnicionPlan: (dia: Dia, entradaId: string, conGuarnicion: boolean) => void
  marcarCocinada: (dia: Dia, entradaId: string, cocinada: boolean) => void
  mover: (desdeDia: Dia, hastaDia: Dia, entradaId: string) => void
  limpiar: () => void
  autollenar: (recetas: RecetaListada[], raciones: number) => void
  restaurarPlan: (anterior: Plan) => void
}

export type { Plan }

const PlanificadorContext = createContext<PlanificadorCtx | null>(null)

export function PlanificadorProvider({ children }: { children: ReactNode }) {
  const { recetas, loading } = useRecetasContext()

  // Entradas cuya receta no está en el catálogo, casi siempre una borrada que
  // sigue en la papelera. Se guardan aparte para no perderlas al reescribir el
  // plan: si se restaura la receta, su día vuelve con ella.
  const huerfanasRef = useRef<EntradaPlanDTO[]>([])

  const [plan, cambiarPlan] = useEstadoCompartido<Plan, EntradaPlanDTO[]>({
    nombre: 'el plan de la semana',
    inicial: PLAN_VACIO,
    listo: !loading && recetas.length > 0,
    cargar: getPlan,
    guardar: savePlan,
    serializar: (p) => [...serializar(p), ...huerfanasRef.current],
    hidratar: (dtos) => {
      const conocidas = new Set(recetas.map((r) => r.id))
      huerfanasRef.current = dtos.filter((d) => !conocidas.has(d.recetaId))
      return hidratar(dtos, recetas)
    },
  })

  const { seleccionadas, toggleReceta, setRaciones: setRacionesLista, setGuarnicion: setGuarnicionLista, estaSeleccionada } = useListaCompraContext()
  const { pendientes, quitarPendiente } = usePendientesPlan()

  const seleccionadasRef = useRef(seleccionadas)
  const estaSeleccionadaRef = useRef(estaSeleccionada)
  useEffect(() => { seleccionadasRef.current = seleccionadas }, [seleccionadas])
  useEffect(() => { estaSeleccionadaRef.current = estaSeleccionada }, [estaSeleccionada])

  const planIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const totales = new Map<string, { receta: RecetaListada; raciones: number; conGuarnicion: boolean }>()
    for (const dia of DIAS) {
      for (const { receta, raciones, cocinada, conGuarnicion } of plan[dia]) {
        if (cocinada) continue
        const prev = totales.get(receta.id)
        totales.set(receta.id, {
          receta,
          raciones: (prev?.raciones ?? 0) + raciones,
          conGuarnicion: (prev?.conGuarnicion ?? false) || !!conGuarnicion,
        })
      }
    }

    for (const [, { receta, raciones, conGuarnicion }] of totales) {
      if (!estaSeleccionadaRef.current(receta.id)) {
        toggleReceta(receta)
      }
      setRacionesLista(receta.id, raciones)
      setGuarnicionLista(receta.id, conGuarnicion)
    }

    for (const prevId of planIdsRef.current) {
      if (!totales.has(prevId)) {
        const entrada = seleccionadasRef.current.find((e) => e.receta.id === prevId)
        if (entrada) toggleReceta(entrada.receta)
      }
    }

    planIdsRef.current = new Set(totales.keys())
  }, [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pendientes.length === 0) return
    const enPlan = new Set<string>()
    for (const dia of DIAS) for (const e of plan[dia]) enPlan.add(e.receta.id)
    for (const p of pendientes) {
      if (enPlan.has(p.receta.id)) quitarPendiente(p.receta.id)
    }
  }, [plan, pendientes, quitarPendiente])

  const añadir = useCallback((dia: Dia, receta: RecetaListada, raciones = racionesBase(receta)) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: [...prev[dia], { id: `${dia}-${receta.id}-${Date.now()}`, receta, raciones }],
    }))
  }, [cambiarPlan])

  const quitar = useCallback((dia: Dia, entradaId: string) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((e) => e.id !== entradaId),
    }))
  }, [cambiarPlan])

  // El techo nunca puede quedar por debajo de las porciones de la receta: si no,
  // una receta de 6 bajaba sola a 4 al primer toque del stepper.
  const setRaciones = useCallback((dia: Dia, entradaId: string, raciones: number) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) =>
        e.id === entradaId
          ? { ...e, raciones: Math.max(1, Math.min(Math.max(4, racionesBase(e.receta)), raciones)) }
          : e
      ),
    }))
  }, [cambiarPlan])

  const setGuarnicionPlan = useCallback((dia: Dia, entradaId: string, conGuarnicion: boolean) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) => (e.id === entradaId ? { ...e, conGuarnicion } : e)),
    }))
  }, [cambiarPlan])

  const marcarCocinada = useCallback((dia: Dia, entradaId: string, cocinada: boolean) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) => (e.id === entradaId ? { ...e, cocinada } : e)),
    }))
  }, [cambiarPlan])

  const mover = useCallback((desdeDia: Dia, hastaDia: Dia, entradaId: string) => {
    if (desdeDia === hastaDia) return
    cambiarPlan((prev) => {
      const entrada = prev[desdeDia].find((e) => e.id === entradaId)
      if (!entrada) return prev
      return {
        ...prev,
        [desdeDia]: prev[desdeDia].filter((e) => e.id !== entradaId),
        [hastaDia]: [...prev[hastaDia], entrada],
      }
    })
  }, [cambiarPlan])

  const limpiar = useCallback(() => {
    huerfanasRef.current = []
    cambiarPlan(PLAN_VACIO)
  }, [cambiarPlan])

  // Rehacer la semana respeta lo ya cocinado: ese plato ya se comió y ya se
  // descontó de la despensa, así que borrarlo sería mentir sobre lo que pasó. Lo
  // demás se sustituye, y lo cocinado entra en el cálculo del resto para que la
  // semana salga equilibrada contando lo que ya hay, no desde cero.
  const autollenar = useCallback((recetas: RecetaListada[], raciones: number) => {
    if (recetas.length === 0) return
    huerfanasRef.current = huerfanasRef.current.filter((d) => d.cocinada)
    cambiarPlan((prev) => {
      const nuevo = Object.fromEntries(
        DIAS.map((d) => [d, prev[d].filter((e) => e.cocinada)])
      ) as unknown as Plan
      const hechas = DIAS.flatMap((d) => nuevo[d]).map((e) => e.receta)
      const porLlenar = DIAS.filter((d) => nuevo[d].length === 0)
      if (porLlenar.length === 0) return nuevo

      const semana = semanaEquilibrada(recetas, porLlenar.length, Date.now(), hechas)
      if (semana.length === 0) return nuevo

      porLlenar.forEach((dia, i) => {
        const receta = semana[i % semana.length]
        nuevo[dia] = [{
          id: `${dia}-${receta.id}-${Date.now()}-${Math.random()}`,
          receta,
          raciones,
          ...(receta.guarnicion ? { conGuarnicion: true } : {}),
        }]
      })
      return nuevo
    })
  }, [cambiarPlan])

  const restaurarPlan = useCallback((anterior: Plan) => {
    cambiarPlan(anterior)
  }, [cambiarPlan])

  const valor = useMemo(
    () => ({ plan, dias: DIAS, añadir, quitar, setRaciones, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan }),
    [plan, añadir, quitar, setRaciones, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan]
  )

  return <PlanificadorContext.Provider value={valor}>{children}</PlanificadorContext.Provider>
}

export function usePlanificador() {
  const ctx = useContext(PlanificadorContext)
  if (!ctx) throw new Error('usePlanificador fuera de PlanificadorProvider')
  return ctx
}
