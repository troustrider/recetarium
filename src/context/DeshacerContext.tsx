import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Deshacer de una sola ranura: la última acción destructiva deja aquí cómo
// revertirse y el aviso de abajo la ofrece durante unos segundos. Restaurar es
// siempre "escribe otra vez el estado anterior", así que vale igual para el
// plan, la despensa y la lista, y se sincroniza como cualquier otro cambio.
//
// Una acción nueva sustituye a la anterior: no hay pila. Con estado compartido
// entre dos móviles, una pila de deshacer acabaría revirtiendo cosas que el
// otro ya había tocado.

interface Accion {
  id: number
  mensaje: string
  deshacer: () => void
}

interface DeshacerCtx {
  pendiente: Accion | null
  registrar: (mensaje: string, deshacer: () => void) => void
  ejecutar: () => void
  descartar: () => void
}

const DeshacerContext = createContext<DeshacerCtx | null>(null)

const VIDA_MS = 8000

export function DeshacerProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<Accion | null>(null)

  const registrar = useCallback((mensaje: string, deshacer: () => void) => {
    setPendiente({ id: Date.now() + Math.random(), mensaje, deshacer })
  }, [])

  const descartar = useCallback(() => setPendiente(null), [])

  // La llamada va fuera del setState: en StrictMode el updater se ejecuta dos
  // veces y deshacer dos veces no es idempotente.
  const ejecutar = useCallback(() => {
    if (!pendiente) return
    pendiente.deshacer()
    setPendiente(null)
  }, [pendiente])

  useEffect(() => {
    if (!pendiente) return
    const t = window.setTimeout(() => setPendiente(null), VIDA_MS)
    return () => window.clearTimeout(t)
  }, [pendiente])

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
