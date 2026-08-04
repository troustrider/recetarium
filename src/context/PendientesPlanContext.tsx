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
  const tocadoRef = useRef(false)
  const pendientesRef = useRef(pendientes)
  const serializar = (lista: PendientePlan[]): PendientePlanDTO[] =>
    lista.map(({ receta, raciones }) => ({ recetaId: receta.id, raciones }))

  useEffect(() => {
    if (hidratadoRef.current || loading || recetas.length === 0) return
    let cancelado = false
    getPendientes()
      .then((dtos) => {
        if (cancelado) return
        // Lo que el usuario haya marcado mientras cargaba manda sobre la
        // respuesta: se sube en vez de perderse.
        if (tocadoRef.current) {
          savePendientes(serializar(pendientesRef.current)).catch(() => {})
          return
        }
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
    pendientesRef.current = pendientes
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const dtos = serializar(pendientes)
    const t = setTimeout(() => { savePendientes(dtos).catch(() => {}) }, 800)
    return () => clearTimeout(t)
  }, [pendientes])

  const marcarPendientes = useCallback((entradas: PendientePlan[]) => {
    tocadoRef.current = true
    setPendientes((prev) => {
      const nuevos = entradas.filter((e) => !prev.some((p) => p.receta.id === e.receta.id))
      return nuevos.length === 0 ? prev : [...prev, ...nuevos]
    })
  }, [])

  const quitarPendiente = useCallback((recetaId: string) => {
    tocadoRef.current = true
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
