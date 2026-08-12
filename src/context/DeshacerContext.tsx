import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

interface Accion {
  id: number
  mensaje: string
  deshacer: () => void
  alCerrar?: () => void
}

interface DeshacerCtx {
  pendiente: Accion | null
  registrar: (mensaje: string, deshacer: () => void, alCerrar?: () => void) => void
  ejecutar: () => void
  descartar: () => void
}

const DeshacerContext = createContext<DeshacerCtx | null>(null)

const VIDA_MS = 8000

export function DeshacerProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<Accion | null>(null)

  const vivaRef = useRef<Accion | null>(null)

  const descartar = useCallback(() => {
    vivaRef.current?.alCerrar?.()
    vivaRef.current = null
    setPendiente(null)
  }, [])

  const registrar = useCallback((mensaje: string, deshacer: () => void, alCerrar?: () => void) => {
    vivaRef.current?.alCerrar?.()
    const accion = { id: Date.now() + Math.random(), mensaje, deshacer, alCerrar }
    vivaRef.current = accion
    setPendiente(accion)
  }, [])

  const ejecutar = useCallback(() => {
    const viva = vivaRef.current
    if (!viva) return
    vivaRef.current = null
    setPendiente(null)
    viva.deshacer()
  }, [])

  useEffect(() => {
    if (!pendiente) return
    const t = window.setTimeout(descartar, VIDA_MS)
    return () => window.clearTimeout(t)
  }, [pendiente, descartar])

  const valor = useMemo(
    () => ({ pendiente, registrar, ejecutar, descartar }),
    [pendiente, registrar, ejecutar, descartar]
  )

  return <DeshacerContext.Provider value={valor}>{children}</DeshacerContext.Provider>
}

export function useDeshacer() {
  const ctx = useContext(DeshacerContext)
  if (!ctx) throw new Error('useDeshacer fuera de DeshacerProvider')
  return ctx
}
