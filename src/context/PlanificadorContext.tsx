import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import type { Receta } from '../types/receta'
import { useListaCompraContext } from './ListaCompraContext'
import { useRecetasContext } from './RecetasContext'
import { getPlan, savePlan, type EntradaPlanDTO } from '../api/estado'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export type Dia = typeof DIAS[number]

export interface EntradaPlan {
  id: string
  receta: Receta
  raciones: number
}

type Plan = Record<Dia, EntradaPlan[]>

const PLAN_VACIO: Plan = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan

function serializar(plan: Plan): EntradaPlanDTO[] {
  const out: EntradaPlanDTO[] = []
  for (const dia of DIAS) {
    for (const e of plan[dia]) out.push({ dia, recetaId: e.receta.id, raciones: e.raciones })
  }
  return out
}

function hidratar(dtos: EntradaPlanDTO[], recetas: Receta[]): Plan {
  const byId = new Map(recetas.map((r) => [r.id, r]))
  const result = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
  for (const { dia, recetaId, raciones } of dtos) {
    const receta = byId.get(recetaId)
    if (!receta || !DIAS.includes(dia as Dia)) continue
    result[dia as Dia].push({ id: `${dia}-${recetaId}-${Date.now()}-${Math.random()}`, receta, raciones })
  }
  return result
}

interface PlanificadorCtx {
  plan: Plan
  dias: readonly Dia[]
  añadir: (dia: Dia, receta: Receta) => void
  quitar: (dia: Dia, entradaId: string) => void
  setRaciones: (dia: Dia, entradaId: string, raciones: number) => void
  mover: (desdeDia: Dia, hastaDia: Dia, entradaId: string) => void
  limpiar: () => void
  autollenar: (recetas: Receta[], raciones: number) => void
}

const PlanificadorContext = createContext<PlanificadorCtx | null>(null)

export function PlanificadorProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(PLAN_VACIO)
  const { recetas, loading } = useRecetasContext()
  const { seleccionadas, toggleReceta, setRaciones: setRacionesLista, estaSeleccionada } = useListaCompraContext()

  // Carga inicial del plan compartido desde el backend (una sola vez,
  // cuando el catálogo está disponible para rehidratar por id).
  const hidratadoRef = useRef(false)
  const saltarGuardadoRef = useRef(false)
  useEffect(() => {
    if (hidratadoRef.current || loading || recetas.length === 0) return
    let cancelado = false
    getPlan()
      .then((dtos) => {
        if (cancelado) return
        saltarGuardadoRef.current = true
        setPlan(hidratar(dtos, recetas))
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })
    return () => { cancelado = true }
  }, [loading, recetas])

  // Guardado con debounce ante cambios del plan (tras la hidratación).
  useEffect(() => {
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const t = setTimeout(() => {
      savePlan(serializar(plan)).catch(() => {})
    }, 800)
    return () => clearTimeout(t)
  }, [plan])

  const seleccionadasRef = useRef(seleccionadas)
  const estaSeleccionadaRef = useRef(estaSeleccionada)
  useEffect(() => { seleccionadasRef.current = seleccionadas }, [seleccionadas])
  useEffect(() => { estaSeleccionadaRef.current = estaSeleccionada }, [estaSeleccionada])

  // IDs de recetas que el planificador puso en la lista de compra
  const planIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const totales = new Map<string, { receta: Receta; raciones: number }>()
    for (const dia of DIAS) {
      for (const { receta, raciones } of plan[dia]) {
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

  function añadir(dia: Dia, receta: Receta) {
    setPlan((prev) => ({
      ...prev,
      [dia]: [...prev[dia], { id: `${dia}-${receta.id}-${Date.now()}`, receta, raciones: 1 }],
    }))
  }

  function quitar(dia: Dia, entradaId: string) {
    setPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((e) => e.id !== entradaId),
    }))
  }

  function setRaciones(dia: Dia, entradaId: string, raciones: number) {
    setPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) =>
        e.id === entradaId ? { ...e, raciones: Math.max(1, Math.min(4, raciones)) } : e
      ),
    }))
  }

  function mover(desdeDia: Dia, hastaDia: Dia, entradaId: string) {
    if (desdeDia === hastaDia) return
    setPlan((prev) => {
      const entrada = prev[desdeDia].find((e) => e.id === entradaId)
      if (!entrada) return prev
      return {
        ...prev,
        [desdeDia]: prev[desdeDia].filter((e) => e.id !== entradaId),
        [hastaDia]: [...prev[hastaDia], entrada],
      }
    })
  }

  function limpiar() {
    setPlan(PLAN_VACIO)
  }

  // Rellena los 7 días con una receta al azar cada uno (mismas raciones).
  function autollenar(recetas: Receta[], raciones: number) {
    if (recetas.length === 0) return
    const nuevo = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
    for (const dia of DIAS) {
      const receta = recetas[Math.floor(Math.random() * recetas.length)]
      nuevo[dia] = [{ id: `${dia}-${receta.id}-${Date.now()}-${Math.random()}`, receta, raciones }]
    }
    setPlan(nuevo)
  }

  return (
    <PlanificadorContext.Provider value={{ plan, dias: DIAS, añadir, quitar, setRaciones, mover, limpiar, autollenar }}>
      {children}
    </PlanificadorContext.Provider>
  )
}

export function usePlanificador() {
  const ctx = useContext(PlanificadorContext)
  if (!ctx) throw new Error('usePlanificador fuera de PlanificadorProvider')
  return ctx
}
