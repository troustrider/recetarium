import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import type { Receta } from '../types/receta'
import { useRecetasContext } from './RecetasContext'
import { getPendientes, savePendientes, type PendientePlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'

export interface PendientePlan {
  receta: Receta
  raciones: number
}

interface PendientesPlanCtx {
  pendientes: PendientePlan[]
  marcarPendientes: (entradas: PendientePlan[]) => void
  quitarPendiente: (recetaId: string) => void
}

const PendientesPlanContext = createContext<PendientesPlanCtx | null>(null)

export function PendientesPlanProvider({ children }: { children: ReactNode }) {
  const { recetas, loading } = useRecetasContext()

  // Recetas ya compradas que faltan por colocar en el planificador. Se hidratan
  // por id contra el catálogo, así que hay que esperar a tenerlo.
  const [pendientes, setPendientes] = useEstadoCompartido<PendientePlan[], PendientePlanDTO[]>({
    nombre: 'las recetas compradas',
    inicial: [],
    listo: !loading && recetas.length > 0,
    cargar: getPendientes,
    guardar: savePendientes,
    serializar: (lista) => lista.map(({ receta, raciones }) => ({ recetaId: receta.id, raciones })),
    hidratar: (dtos) => {
      const byId = new Map(recetas.map((r) => [r.id, r]))
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

  const valor = useMemo(
    () => ({ pendientes, marcarPendientes, quitarPendiente }),
    [pendientes, marcarPendientes, quitarPendiente]
  )

  return <PendientesPlanContext.Provider value={valor}>{children}</PendientesPlanContext.Provider>
}

export function usePendientesPlan() {
  const ctx = useContext(PendientesPlanContext)
  if (!ctx) throw new Error('usePendientesPlan fuera de PendientesPlanProvider')
  return ctx
}
