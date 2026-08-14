import { createContext, useContext, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { RecetaListada } from '../types/receta'
import { useRecetasContext } from './RecetasContext'
import { getPendientes, savePendientes, type PendientePlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'

export interface PendientePlan {
  receta: RecetaListada
  raciones: number
}

interface PendientesPlanCtx {
  pendientes: PendientePlan[]
  marcarPendientes: (entradas: PendientePlan[]) => void
  quitarPendiente: (recetaId: string) => void
  restaurarPendientes: (anterior: PendientePlan[]) => void
}

const PendientesPlanContext = createContext<PendientesPlanCtx | null>(null)

export function PendientesPlanProvider({ children }: { children: ReactNode }) {
  const { recetas, loading } = useRecetasContext()

  // Igual que en el plan: una receta borrada que siga en la papelera no debe
  // desaparecer de los pendientes por reescribir la lista.
  const huerfanasRef = useRef<PendientePlanDTO[]>([])

  const [pendientes, setPendientes] = useEstadoCompartido<PendientePlan[], PendientePlanDTO[]>({
    nombre: 'las recetas compradas',
    inicial: [],
    listo: !loading && recetas.length > 0,
    cargar: getPendientes,
    guardar: savePendientes,
    serializar: (lista) => [
      ...lista.map(({ receta, raciones }) => ({ recetaId: receta.id, raciones })),
      ...huerfanasRef.current,
    ],
    hidratar: (dtos) => {
      const byId = new Map(recetas.map((r) => [r.id, r]))
      huerfanasRef.current = dtos.filter((d) => !byId.has(d.recetaId))
      return dtos.flatMap(({ recetaId, raciones }) => {
        const receta = byId.get(recetaId)
        return receta ? [{ receta, raciones }] : []
      })
    },
  })

  const marcarPendientes = useCallback((entradas: PendientePlan[]) => {
    setPendientes((prev) => {
      const nuevos = entradas.filter((e) => !prev.some((p) => p.receta.id === e.receta.id))
      return nuevos.length === 0 ? prev : [...prev, ...nuevos]
    })
  }, [setPendientes])

  const quitarPendiente = useCallback((recetaId: string) => {
    setPendientes((prev) => prev.filter((p) => p.receta.id !== recetaId))
  }, [setPendientes])

  const restaurarPendientes = useCallback((anterior: PendientePlan[]) => {
    setPendientes(anterior)
  }, [setPendientes])

  const valor = useMemo(
    () => ({ pendientes, marcarPendientes, quitarPendiente, restaurarPendientes }),
    [pendientes, marcarPendientes, quitarPendiente, restaurarPendientes]
  )

  return <PendientesPlanContext.Provider value={valor}>{children}</PendientesPlanContext.Provider>
}

export function usePendientesPlan() {
  const ctx = useContext(PendientesPlanContext)
  if (!ctx) throw new Error('usePendientesPlan fuera de PendientesPlanProvider')
  return ctx
}
