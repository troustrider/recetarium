import tabla from '../data/precios.json'
import { normalizar, canonUnidad } from './ingredientes'
import { convertir } from './cantidades'
import { mismoIngrediente, despensaCubre } from './despensa'

interface EntradaPrecio {
  nombre: string
  euros: number
  unidad: string
  fuente: string
  revisado: string
  formato?: string
  gramosPorUd?: number
}

export const PRECIOS: EntradaPrecio[] = tabla.precios

const COCINA: Record<string, { g?: number; ml?: number }> = {
  cucharada: { g: 12, ml: 15 },
  cucharadita: { g: 4, ml: 5 },
  vaso: { g: 180, ml: 200 },
  punado: { g: 25 },
  diente: { g: 5 },
  hoja: { g: 0.5 },
  loncha: { g: 20 },
  rodaja: { g: 15 },
  rebanada: { g: 30 },
  tira: { g: 30 },
  lata: { g: 400 },
  paquete: { g: 250 },
  gota: { ml: 0.05 },
}

function dimension(unidad: string): 'g' | 'ml' | 'ud' | null {
  const u = normalizar(unidad)
  if (u === 'g' || u === 'kg') return 'g'
  if (u === 'ml' || u === 'cl' || u === 'l') return 'ml'
  if (u === 'ud') return 'ud'
  return null
}

export function buscarPrecio(nombre: string): EntradaPrecio | null {
  const exacta = PRECIOS.find((p) => mismoIngrediente(p.nombre, nombre))
  if (exacta) return exacta

  const candidatas = PRECIOS.filter((p) => despensaCubre(p.nombre, nombre))
  if (candidatas.length === 0) return null
  return candidatas.reduce((a, b) => (b.nombre.length > a.nombre.length ? b : a))
}

interface ItemPrecio {
  nombre: string
  cantidad: number
  unidad: string
}

export function precioDe(item: ItemPrecio): number | null {
  const unidad = canonUnidad(item.nombre, item.unidad)
  if (unidad === 'al gusto') return 0

  const entrada = buscarPrecio(item.nombre)
  if (!entrada) return null

  const dim = dimension(entrada.unidad)
  if (!dim) return null

  const porBase = convertir(1, entrada.unidad, dim)
  if (porBase == null || porBase === 0) return null
  const eurosPorBase = entrada.euros / porBase

  const cantidadBase = enUnidadBase(item.cantidad, unidad, dim, entrada)
  return cantidadBase == null ? null : redondearCentimos(cantidadBase * eurosPorBase)
}

function enGramos(cantidad: number, unidad: string): number | null {
  const directa = convertir(cantidad, unidad, 'g')
  if (directa != null) return directa
  const enBase = COCINA[normalizar(unidad)]?.g
  return enBase == null ? null : cantidad * enBase
}

function enUnidadBase(
  cantidad: number,
  unidad: string,
  dim: 'g' | 'ml' | 'ud',
  entrada: EntradaPrecio
): number | null {
  const directa = convertir(cantidad, unidad, dim)
  if (directa != null) return directa

  if (normalizar(unidad) === 'ud' && dim === 'g' && entrada.gramosPorUd) {
    return cantidad * entrada.gramosPorUd
  }

  // La receta pide peso y la tabla cobra por pieza (una lechuga, un pimiento).
  if (dim === 'ud') {
    if (!entrada.gramosPorUd) return null
    const gramos = enGramos(cantidad, unidad)
    return gramos == null ? null : gramos / entrada.gramosPorUd
  }

  const enBase = COCINA[normalizar(unidad)]?.[dim]
  if (enBase != null) return cantidad * enBase

  return convertir(cantidad, unidad, dim === 'g' ? 'ml' : 'g')
}

function redondearCentimos(n: number): number {
  return Math.round(n * 100) / 100
}

export interface CosteCompra {
  total: number
  sinPrecio: string[]
}

export function costeCompra(items: ItemPrecio[]): CosteCompra {
  let total = 0
  const sinPrecio = new Set<string>()
  for (const item of items) {
    const precio = precioDe(item)
    if (precio == null) sinPrecio.add(item.nombre)
    else total += precio
  }
  return { total: redondearCentimos(total), sinPrecio: [...sinPrecio] }
}
