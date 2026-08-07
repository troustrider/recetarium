import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

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
  // Se llama si la oferta se retira sin usarse (caduca, se cierra, o llega otra
  // acción). Quien tenga su propio estado de deshacer lo limpia aquí, para que
  // no reviva al volver a la pantalla.
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

  // Espejo en ref: las tres operaciones leen la acción viva sin depender de ella,
  // así los callbacks son estables y no hay cierres caducos en el temporizador.
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
