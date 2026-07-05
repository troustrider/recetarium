import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { getDespensa, saveDespensa } from '../api/estado'
import { mismoIngrediente } from '../utils/despensa'

export type EstadoDespensa = 'lleno' | 'poco'

export interface IngredienteDespensa {
  nombre: string
  familia: string
  estado: EstadoDespensa
  caducidad?: string // YYYY-MM-DD
}

interface DespensaCtx {
  despensa: IngredienteDespensa[]
  añadir: (nombre: string, familia: string, caducidad?: string) => void
  quitar: (nombre: string) => void
  setEstado: (nombre: string, estado: EstadoDespensa) => void
  setCaducidad: (nombre: string, caducidad?: string) => void
  setFamilia: (nombre: string, familia: string) => void
  tieneIngrediente: (nombre: string) => boolean
}

const DespensaContext = createContext<DespensaCtx | null>(null)

const STORAGE_KEY = 'recetarium-despensa'

function normalizar(s: string) {
  return s.trim().toLowerCase()
}

function leerCacheLocal(): IngredienteDespensa[] {
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
}

export function DespensaProvider({ children }: { children: ReactNode }) {
  // El cache local pinta la UI al instante; el backend es la fuente de verdad
  // compartida y se impone en cuanto responde.
  const [despensa, setDespensa] = useState<IngredienteDespensa[]>(leerCacheLocal)

  const hidratadoRef = useRef(false)
  const saltarGuardadoRef = useRef(false)
  useEffect(() => {
    let cancelado = false
    getDespensa()
      .then((remota) => {
        if (cancelado) return
        if (remota.length > 0) {
          saltarGuardadoRef.current = true
          setDespensa(remota)
        } else {
          // Backend vacío: migración única de lo que hubiera en este dispositivo.
          const local = leerCacheLocal()
          if (local.length > 0) saveDespensa(local).catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })
    return () => { cancelado = true }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(despensa))
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const t = setTimeout(() => { saveDespensa(despensa).catch(() => {}) }, 800)
    return () => clearTimeout(t)
  }, [despensa])

  function añadir(nombre: string, familia: string, caducidad?: string) {
    const norm = normalizar(nombre)
    const fam = normalizar(familia) || 'otros'
    if (!norm || despensa.some((i) => mismoIngrediente(i.nombre, norm))) return
    setDespensa((prev) =>
      [...prev, { nombre: norm, familia: fam, estado: 'lleno' as EstadoDespensa, ...(caducidad ? { caducidad } : {}) }].sort((a, b) =>
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

  function setCaducidad(nombre: string, caducidad?: string) {
    setDespensa((prev) =>
      prev.map((i) => {
        if (i.nombre !== normalizar(nombre)) return i
        if (caducidad) return { ...i, caducidad }
        const copia = { ...i }
        delete copia.caducidad
        return copia
      })
    )
  }

  function setFamilia(nombre: string, familia: string) {
    setDespensa((prev) =>
      prev
        .map((i) => (i.nombre === normalizar(nombre) ? { ...i, familia: normalizar(familia) || 'otros' } : i))
        .sort((a, b) => a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre))
    )
  }

  function tieneIngrediente(nombre: string) {
    return despensa.some((i) => mismoIngrediente(i.nombre, nombre))
  }

  return (
    <DespensaContext.Provider value={{ despensa, añadir, quitar, setEstado, setCaducidad, setFamilia, tieneIngrediente }}>
      {children}
    </DespensaContext.Provider>
  )
}

export function useDespensa() {
  const ctx = useContext(DespensaContext)
  if (!ctx) throw new Error('useDespensa fuera de DespensaProvider')
  return ctx
}
