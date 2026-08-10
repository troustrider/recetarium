import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// Deshacer de una sola ranura: la última acción destructiva deja aquí cómo
// revertirse y el aviso de abajo la ofrece unos segundos. Restaurar es siempre
// "escribe otra vez el estado anterior", así que sirve igual para plan,
// despensa y lista.
//
// Sin pila, a propósito: con el estado compartido entre dos móviles, una pila
// acabaría revirtiendo cosas que el otro ya había tocado.

interface Accion {
  id: number
  mensaje: string
  deshacer: () => void
  // Si la oferta se retira sin usarse (caduca, se cierra, llega otra acción).
  // Quien tenga su propio estado de deshacer lo limpia aquí.
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

  // Espejo en ref: los callbacks quedan estables y el temporizador no arrastra
  // cierres caducos.
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

  // La llamada va fuera del setState: en StrictMode el updater se ejecuta dos
  // veces y deshacer dos veces no es idempotente.
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
