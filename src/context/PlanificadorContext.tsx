import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { Receta } from '../types/receta'
import { useListaCompraContext } from './ListaCompraContext'
import { useRecetasContext } from './RecetasContext'
import { usePendientesPlan } from './PendientesPlanContext'
import { getPlan, savePlan, type EntradaPlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { racionesBase } from '../hooks/useListaCompra'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export type Dia = typeof DIAS[number]

export interface EntradaPlan {
  id: string
  receta: Receta
  raciones: number
  // Plato ya hecho: sale de la lista de la compra y su chip queda en gris.
  cocinada?: boolean
}

type Plan = Record<Dia, EntradaPlan[]>

const PLAN_VACIO: Plan = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan

function serializar(plan: Plan): EntradaPlanDTO[] {
  const out: EntradaPlanDTO[] = []
  for (const dia of DIAS) {
    for (const e of plan[dia]) {
      out.push({ dia, recetaId: e.receta.id, raciones: e.raciones, ...(e.cocinada ? { cocinada: true } : {}) })
    }
  }
  return out
}

function hidratar(dtos: EntradaPlanDTO[], recetas: Receta[]): Plan {
  const byId = new Map(recetas.map((r) => [r.id, r]))
  const result = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
  for (const { dia, recetaId, raciones, cocinada } of dtos) {
    const receta = byId.get(recetaId)
    if (!receta || !DIAS.includes(dia as Dia)) continue
    result[dia as Dia].push({
      id: `${dia}-${recetaId}-${Date.now()}-${Math.random()}`,
      receta,
      raciones,
      ...(cocinada ? { cocinada: true } : {}),
    })
  }
  return result
}

interface PlanificadorCtx {
  plan: Plan
  dias: readonly Dia[]
  añadir: (dia: Dia, receta: Receta, raciones?: number) => void
  quitar: (dia: Dia, entradaId: string) => void
  setRaciones: (dia: Dia, entradaId: string, raciones: number) => void
  marcarCocinada: (dia: Dia, entradaId: string, cocinada: boolean) => void
  mover: (desdeDia: Dia, hastaDia: Dia, entradaId: string) => void
  limpiar: () => void
  autollenar: (recetas: Receta[], raciones: number) => void
}

const PlanificadorContext = createContext<PlanificadorCtx | null>(null)

export function PlanificadorProvider({ children }: { children: ReactNode }) {
  const { recetas, loading } = useRecetasContext()

  // Se hidrata por id contra el catálogo, así que espera a tenerlo cargado.
  const [plan, cambiarPlan] = useEstadoCompartido<Plan, EntradaPlanDTO[]>({
    nombre: 'el plan de la semana',
    inicial: PLAN_VACIO,
    listo: !loading && recetas.length > 0,
    cargar: getPlan,
    guardar: savePlan,
    serializar,
    hidratar: (dtos) => hidratar(dtos, recetas),
  })

  const { seleccionadas, toggleReceta, setRaciones: setRacionesLista, estaSeleccionada } = useListaCompraContext()
  const { pendientes, quitarPendiente } = usePendientesPlan()

  const seleccionadasRef = useRef(seleccionadas)
  const estaSeleccionadaRef = useRef(estaSeleccionada)
  useEffect(() => { seleccionadasRef.current = seleccionadas }, [seleccionadas])
  useEffect(() => { estaSeleccionadaRef.current = estaSeleccionada }, [estaSeleccionada])

  // IDs de recetas que el planificador puso en la lista de compra
  const planIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const totales = new Map<string, { receta: Receta; raciones: number }>()
    for (const dia of DIAS) {
      for (const { receta, raciones, cocinada } of plan[dia]) {
        // Lo ya cocinado ni se compra ni se cuenta.
        if (cocinada) continue
        const prev = totales.get(receta.id)
        totales.set(receta.id, { receta, raciones: (prev?.raciones ?? 0) + raciones })
      }
    }

    for (const [, { receta, raciones }] of totales) {
      if (!estaSeleccionadaRef.current(receta.id)) {
        toggleReceta(receta)
      }
      setRacionesLista(receta.id, raciones)
    }

    // Solo quita de la lista lo que el planificador había añadido antes
    for (const prevId of planIdsRef.current) {
      if (!totales.has(prevId)) {
        const entrada = seleccionadasRef.current.find((e) => e.receta.id === prevId)
        if (entrada) toggleReceta(entrada.receta)
      }
    }

    planIdsRef.current = new Set(totales.keys())
  }, [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  // Una pendiente de planificar deja de serlo en cuanto entra en el plan,
  // da igual por qué vía (drag, selector de día, autollenar).
  useEffect(() => {
    if (pendientes.length === 0) return
    const enPlan = new Set<string>()
    for (const dia of DIAS) for (const e of plan[dia]) enPlan.add(e.receta.id)
    for (const p of pendientes) {
      if (enPlan.has(p.receta.id)) quitarPendiente(p.receta.id)
    }
  }, [plan, pendientes, quitarPendiente])

  const añadir = useCallback((dia: Dia, receta: Receta, raciones = racionesBase(receta)) => {
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

  const setRaciones = useCallback((dia: Dia, entradaId: string, raciones: number) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) =>
        e.id === entradaId ? { ...e, raciones: Math.max(1, Math.min(4, raciones)) } : e
      ),
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
    cambiarPlan(PLAN_VACIO)
  }, [cambiarPlan])

  // Rellena los 7 días con una receta al azar cada uno (mismas raciones).
  const autollenar = useCallback((recetas: Receta[], raciones: number) => {
    if (recetas.length === 0) return
    const nuevo = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
    for (const dia of DIAS) {
      const receta = recetas[Math.floor(Math.random() * recetas.length)]
      nuevo[dia] = [{ id: `${dia}-${receta.id}-${Date.now()}-${Math.random()}`, receta, raciones }]
    }
    cambiarPlan(nuevo)
  }, [cambiarPlan])

  const valor = useMemo(
    () => ({ plan, dias: DIAS, añadir, quitar, setRaciones, marcarCocinada, mover, limpiar, autollenar }),
    [plan, añadir, quitar, setRaciones, marcarCocinada, mover, limpiar, autollenar]
  )

  return <PlanificadorContext.Provider value={valor}>{children}</PlanificadorContext.Provider>
}

export function usePlanificador() {
  const ctx = useContext(PlanificadorContext)
  if (!ctx) throw new Error('usePlanificador fuera de PlanificadorProvider')
  return ctx
}
