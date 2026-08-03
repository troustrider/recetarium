import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { getDespensa, saveDespensa } from '../api/estado'
import { mismoIngrediente } from '../utils/despensa'
import { convertir, redondear, unidadMedible } from '../utils/cantidades'

export type EstadoDespensa = 'lleno' | 'poco'

export interface IngredienteDespensa {
  nombre: string
  familia: string
  estado: EstadoDespensa
  caducidad?: string // YYYY-MM-DD
  // Opcionales: solo tienen sentido en familias que se miden (carnes, lácteos,
  // cereales…). Ver requiereCantidad() en utils/cantidades.
  cantidad?: number
  unidad?: string
}

export interface AltaIngrediente {
  caducidad?: string
  cantidad?: number
  unidad?: string
}

// null borra el campo; undefined lo deja como está.
export interface CambiosIngrediente {
  nombre?: string
  familia?: string
  estado?: EstadoDespensa
  caducidad?: string | null
  cantidad?: number | null
  unidad?: string
}

interface DespensaCtx {
  despensa: IngredienteDespensa[]
  añadir: (nombre: string, familia: string, alta?: AltaIngrediente) => void
  reponer: (nombre: string, familia: string, cantidad?: number, unidad?: string) => void
  editar: (nombre: string, cambios: CambiosIngrediente) => void
  quitar: (nombre: string) => void
  vaciar: () => void
  tieneIngrediente: (nombre: string) => boolean
}

const DespensaContext = createContext<DespensaCtx | null>(null)

const STORAGE_KEY = 'recetarium-despensa'

function normalizar(s: string) {
  return s.trim().toLowerCase()
}

function porFamiliaYNombre(a: IngredienteDespensa, b: IngredienteDespensa) {
  return a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
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

  function añadir(nombre: string, familia: string, alta: AltaIngrediente = {}) {
    const norm = normalizar(nombre)
    const fam = normalizar(familia) || 'otros'
    if (!norm || despensa.some((i) => mismoIngrediente(i.nombre, norm))) return
    const medible = alta.cantidad != null && alta.cantidad >= 0 && unidadMedible(alta.unidad)
    setDespensa((prev) =>
      [
        ...prev,
        {
          nombre: norm,
          familia: fam,
          estado: 'lleno' as EstadoDespensa,
          ...(alta.caducidad ? { caducidad: alta.caducidad } : {}),
          ...(medible ? { cantidad: alta.cantidad, unidad: normalizar(alta.unidad!) } : {}),
        },
      ].sort(porFamiliaYNombre)
    )
  }

  // Vuelta de la compra: suma al stock existente en vez de ignorar el alta.
  function reponer(nombre: string, familia: string, cantidad?: number, unidad?: string) {
    const norm = normalizar(nombre)
    if (!norm) return
    const medible = cantidad != null && cantidad > 0 && unidadMedible(unidad)
    setDespensa((prev) => {
      const idx = prev.findIndex((i) => mismoIngrediente(i.nombre, norm))
      if (idx === -1) {
        return [
          ...prev,
          {
            nombre: norm,
            familia: normalizar(familia) || 'otros',
            estado: 'lleno' as EstadoDespensa,
            ...(medible ? { cantidad, unidad: normalizar(unidad!) } : {}),
          },
        ].sort(porFamiliaYNombre)
      }
      const actual = prev[idx]
      const copia = [...prev]
      const tieneStock = actual.cantidad != null && unidadMedible(actual.unidad)
      // Si el que había no llevaba cantidad, la compra se la estrena; si la
      // llevaba en otra dimensión (g contra ml), no se inventa una suma.
      const sumado = medible && tieneStock ? convertir(cantidad!, unidad!, actual.unidad!) : null
      copia[idx] =
        !medible || (tieneStock && sumado == null)
          ? { ...actual, estado: 'lleno' }
          : tieneStock
            ? { ...actual, estado: 'lleno', cantidad: redondear(actual.cantidad! + sumado!) }
            : { ...actual, estado: 'lleno', cantidad, unidad: normalizar(unidad!) }
      return copia
    })
  }

  function editar(nombre: string, cambios: CambiosIngrediente) {
    const clave = normalizar(nombre)
    setDespensa((prev) => {
      const nuevoNombre = cambios.nombre != null ? normalizar(cambios.nombre) : null
      // Un renombrado que choca con otro ingrediente se descarta; el resto de
      // cambios sí se aplican.
      const chocaria =
        nuevoNombre != null &&
        nuevoNombre !== clave &&
        prev.some((i) => i.nombre !== clave && mismoIngrediente(i.nombre, nuevoNombre))
      return prev
        .map((i) => {
          if (i.nombre !== clave) return i
          const sig: IngredienteDespensa = { ...i }
          if (nuevoNombre && !chocaria) sig.nombre = nuevoNombre
          if (cambios.familia != null) sig.familia = normalizar(cambios.familia) || 'otros'
          if (cambios.estado != null) sig.estado = cambios.estado
          if (cambios.caducidad === null) delete sig.caducidad
          else if (cambios.caducidad != null) sig.caducidad = cambios.caducidad
          if (cambios.cantidad === null) {
            delete sig.cantidad
            delete sig.unidad
          } else if (cambios.cantidad != null) {
            sig.cantidad = cambios.cantidad
            sig.unidad = normalizar(cambios.unidad ?? sig.unidad ?? 'g')
          } else if (cambios.unidad != null && sig.cantidad != null) {
            sig.unidad = normalizar(cambios.unidad)
          }
          return sig
        })
        .sort(porFamiliaYNombre)
    })
  }

  function quitar(nombre: string) {
    setDespensa((prev) => prev.filter((i) => i.nombre !== normalizar(nombre)))
  }

  function vaciar() {
    setDespensa([])
  }

  function tieneIngrediente(nombre: string) {
    return despensa.some((i) => mismoIngrediente(i.nombre, nombre))
  }

  return (
    <DespensaContext.Provider value={{ despensa, añadir, reponer, editar, quitar, vaciar, tieneIngrediente }}>
      {children}
    </DespensaContext.Provider>
  )
}

export function useDespensa() {
  const ctx = useContext(DespensaContext)
  if (!ctx) throw new Error('useDespensa fuera de DespensaProvider')
  return ctx
}
