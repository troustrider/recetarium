import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import type { Receta } from '../types/receta'
import { useRecetasContext } from './RecetasContext'
import { getPendientes, savePendientes, type PendientePlanDTO } from '../api/estado'

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
  const [pendientes, setPendientes] = useState<PendientePlan[]>([])
  const { recetas, loading } = useRecetasContext()

  // Estado compartido en backend: recetas ya compradas que faltan por
  // colocar en el planificador. Se hidrata por id contra el catálogo.
  const hidratadoRef = useRef(false)
  const saltarGuardadoRef = useRef(false)
  useEffect(() => {
    if (hidratadoRef.current || loading || recetas.length === 0) return
    let cancelado = false
    getPendientes()
      .then((dtos) => {
        if (cancelado) return
        const byId = new Map(recetas.map((r) => [r.id, r]))
        saltarGuardadoRef.current = true
        setPendientes(
          dtos.flatMap(({ recetaId, raciones }) => {
            const receta = byId.get(recetaId)
            return receta ? [{ receta, raciones }] : []
          })
        )
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })
    return () => { cancelado = true }
  }, [loading, recetas])

  useEffect(() => {
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const dtos: PendientePlanDTO[] = pendientes.map(({ receta, raciones }) => ({ recetaId: receta.id, raciones }))
    const t = setTimeout(() => { savePendientes(dtos).catch(() => {}) }, 800)
    return () => clearTimeout(t)
  }, [pendientes])

  const marcarPendientes = useCallback((entradas: PendientePlan[]) => {
    setPendientes((prev) => {
      const nuevos = entradas.filter((e) => !prev.some((p) => p.receta.id === e.receta.id))
      return nuevos.length === 0 ? prev : [...prev, ...nuevos]
    })
  }, [])

  const quitarPendiente = useCallback((recetaId: string) => {
    setPendientes((prev) => prev.filter((p) => p.receta.id !== recetaId))
  }, [])

  return (
    <PendientesPlanContext.Provider value={{ pendientes, marcarPendientes, quitarPendiente }}>
      {children}
    </PendientesPlanContext.Provider>
  )
}

export function usePendientesPlan() {
  const ctx = useContext(PendientesPlanContext)
  if (!ctx) throw new Error('usePendientesPlan fuera de PendientesPlanProvider')
  return ctx
}
