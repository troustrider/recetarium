import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type EstadoDespensa = 'lleno' | 'poco'

export interface IngredienteDespensa {
  nombre: string
  familia: string
  estado: EstadoDespensa
}

interface DespensaCtx {
  despensa: IngredienteDespensa[]
  añadir: (nombre: string, familia: string) => void
  quitar: (nombre: string) => void
  setEstado: (nombre: string, estado: EstadoDespensa) => void
  tieneIngrediente: (nombre: string) => boolean
}

const DespensaContext = createContext<DespensaCtx | null>(null)

const STORAGE_KEY = 'recetarium-despensa'

function normalizar(s: string) {
  return s.trim().toLowerCase()
}

export function DespensaProvider({ children }: { children: ReactNode }) {
  const [despensa, setDespensa] = useState<IngredienteDespensa[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      // Migración desde formato anterior (string[])
      if (stored.length > 0 && typeof stored[0] === 'string') {
        return (stored as string[]).map((nombre) => ({
          nombre: normalizar(nombre),
          familia: 'otros',
          estado: 'lleno' as EstadoDespensa,
        }))
      }
      return stored as IngredienteDespensa[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(despensa))
  }, [despensa])

  function añadir(nombre: string, familia: string) {
    const norm = normalizar(nombre)
    const fam = normalizar(familia) || 'otros'
    if (!norm || despensa.some((i) => i.nombre === norm)) return
    setDespensa((prev) =>
      [...prev, { nombre: norm, familia: fam, estado: 'lleno' }].sort((a, b) =>
        a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
      )
    )
  }

  function quitar(nombre: string) {
    setDespensa((prev) => prev.filter((i) => i.nombre !== normalizar(nombre)))
  }

  function setEstado(nombre: string, estado: EstadoDespensa) {
    setDespensa((prev) =>
      prev.map((i) => (i.nombre === normalizar(nombre) ? { ...i, estado } : i))
    )
  }

  function tieneIngrediente(nombre: string) {
    return despensa.some((i) => i.nombre === normalizar(nombre))
  }

  return (
    <DespensaContext.Provider value={{ despensa, añadir, quitar, setEstado, tieneIngrediente }}>
      {children}
    </DespensaContext.Provider>
  )
}

export function useDespensa() {
  const ctx = useContext(DespensaContext)
  if (!ctx) throw new Error('useDespensa fuera de DespensaProvider')
  return ctx
}
