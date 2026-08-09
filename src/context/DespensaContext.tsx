import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { getDespensa, saveDespensa, type IngredienteDespensaDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { mismoIngrediente } from '../utils/despensa'
import { caducidadEstimada } from '../utils/caducidadEstimada'
import { convertir, redondear, unidadMedible } from '../utils/cantidades'
import type { ConsumoIngrediente } from '../utils/consumo'

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
  consumir: (consumos: ConsumoIngrediente[]) => void
  quitar: (nombre: string) => void
  vaciar: () => void
  tieneIngrediente: (nombre: string) => boolean
  // Vuelve a una despensa anterior tal cual, para el deshacer.
  restaurarDespensa: (anterior: IngredienteDespensa[]) => void
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
  // compartida. Si el backend viene vacío, se sube lo que hubiera en este
  // dispositivo (migración única) devolviendo null desde hidratar.
  const [despensa, cambiarDespensa] = useEstadoCompartido<IngredienteDespensa[], IngredienteDespensaDTO[]>({
    nombre: 'la despensa',
    inicial: leerCacheLocal,
    cargar: getDespensa,
    guardar: saveDespensa,
    serializar: (d) => d,
    hidratar: (remota, actual) =>
      remota.length > 0 ? (remota as IngredienteDespensa[]) : actual.length > 0 ? null : actual,
    alCambiar: (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d)),
  })

  const añadir = useCallback((nombre: string, familia: string, alta: AltaIngrediente = {}) => {
    const norm = normalizar(nombre)
    const fam = normalizar(familia) || 'otros'
    if (!norm) return
    const medible = alta.cantidad != null && alta.cantidad >= 0 && unidadMedible(alta.unidad)
    cambiarDespensa((prev) =>
      prev.some((i) => mismoIngrediente(i.nombre, norm))
        ? prev
        : [
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
  }, [cambiarDespensa])

  // Vuelta de la compra: suma al stock existente en vez de ignorar el alta.
  const reponer = useCallback((nombre: string, familia: string, cantidad?: number, unidad?: string) => {
    const norm = normalizar(nombre)
    if (!norm) return
    const medible = cantidad != null && cantidad > 0 && unidadMedible(unidad)
    cambiarDespensa((prev) => {
      const idx = prev.findIndex((i) => mismoIngrediente(i.nombre, norm))
      if (idx === -1) {
        const fam = normalizar(familia) || 'otros'
        const estimada = caducidadEstimada(norm, fam)
        return [
          ...prev,
          {
            nombre: norm,
            familia: fam,
            estado: 'lleno' as EstadoDespensa,
            ...(estimada ? { caducidad: estimada } : {}),
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
      const repuesto =
        !medible || (tieneStock && sumado == null)
          ? { ...actual, estado: 'lleno' as EstadoDespensa }
          : tieneStock
            ? { ...actual, estado: 'lleno' as EstadoDespensa, cantidad: redondear(actual.cantidad! + sumado!) }
            : { ...actual, estado: 'lleno' as EstadoDespensa, cantidad, unidad: normalizar(unidad!) }
      // La fecha que ya hubiera es del envase o la puso alguien a mano: manda
      // sobre la estimación, que solo estrena a los que no tenían ninguna.
      const estimada = repuesto.caducidad ? null : caducidadEstimada(norm, repuesto.familia)
      copia[idx] = estimada ? { ...repuesto, caducidad: estimada } : repuesto
      return copia
    })
  }, [cambiarDespensa])

  const editar = useCallback((nombre: string, cambios: CambiosIngrediente) => {
    const clave = normalizar(nombre)
    cambiarDespensa((prev) => {
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
  }, [cambiarDespensa])

  // Plato hecho: lo gastado sale de la despensa y lo que sobra se queda con el
  // stock rebajado. Va en un solo cambio para que no se guarden N versiones.
  const consumir = useCallback((consumos: ConsumoIngrediente[]) => {
    if (consumos.length === 0) return
    const porNombre = new Map(consumos.map((c) => [c.nombre, c]))
    cambiarDespensa((prev) =>
      prev.flatMap((i) => {
        const c = porNombre.get(i.nombre)
        if (!c) return [i]
        if (c.accion === 'quitar') return []
        return [{ ...i, cantidad: c.cantidad, unidad: c.unidad ?? i.unidad }]
      })
    )
  }, [cambiarDespensa])

  const quitar = useCallback((nombre: string) => {
    cambiarDespensa((prev) => prev.filter((i) => i.nombre !== normalizar(nombre)))
  }, [cambiarDespensa])

  const vaciar = useCallback(() => {
    cambiarDespensa([])
  }, [cambiarDespensa])

  const tieneIngrediente = useCallback(
    (nombre: string) => despensa.some((i) => mismoIngrediente(i.nombre, nombre)),
    [despensa]
  )

  const restaurarDespensa = useCallback((anterior: IngredienteDespensa[]) => {
    cambiarDespensa(anterior)
  }, [cambiarDespensa])

  const valor = useMemo(
    () => ({ despensa, añadir, reponer, editar, consumir, quitar, vaciar, tieneIngrediente, restaurarDespensa }),
    [despensa, añadir, reponer, editar, consumir, quitar, vaciar, tieneIngrediente, restaurarDespensa]
  )

  return <DespensaContext.Provider value={valor}>{children}</DespensaContext.Provider>
}

export function useDespensa() {
  const ctx = useContext(DespensaContext)
  if (!ctx) throw new Error('useDespensa fuera de DespensaProvider')
  return ctx
}
