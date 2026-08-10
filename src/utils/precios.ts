// Precio de la lista final de la compra, no de las recetas: así no cuenta lo
// que ya está en casa ni se pierde lo añadido a mano.
//
// Regla que no se negocia: un ingrediente sin precio conocido NO se estima por
// encima. Se devuelve aparte para poder decirlo.

import tabla from '../data/precios.json'
import { normalizar, canonUnidad } from './ingredientes'
import { convertir } from './cantidades'
import { mismoIngrediente, despensaCubre } from './despensa'

export interface EntradaPrecio {
  nombre: string
  euros: number
  unidad: string
  fuente: string
  revisado: string
  formato?: string
  // Se vende al peso pero las recetas lo cuentan por piezas ("2 contramuslos").
  gramosPorUd?: number
}

export const PRECIOS: EntradaPrecio[] = tabla.precios
export const CADENAS: string[] = tabla.meta.cadenas

// Equivalencias aproximadas de las unidades de cocina. Aquí y no en convertir()
// a propósito: esa es la aritmética del stock y tiene que seguir negándose a
// comparar "2 cucharadas" con "500 ml", donde una equivalencia inventada
// descuadra la despensa. Para poner precio, aproximar cuesta céntimos.
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

// La entrada más específica gana: una genérica de "pollo" no puede pisar a
// "contramuslos de pollo" y cobrarlos a precio de pechuga.
export function buscarPrecio(nombre: string): EntradaPrecio | null {
  const exacta = PRECIOS.find((p) => mismoIngrediente(p.nombre, nombre))
  if (exacta) return exacta

  const candidatas = PRECIOS.filter((p) => despensaCubre(p.nombre, nombre))
  if (candidatas.length === 0) return null
  return candidatas.reduce((a, b) => (b.nombre.length > a.nombre.length ? b : a))
}

export interface ItemPrecio {
  nombre: string
  cantidad: number
  unidad: string
}

// null = no se puede poner precio (sin entrada, o unidad que no se sabe traducir).
export function precioDe(item: ItemPrecio): number | null {
  const unidad = canonUnidad(item.nombre, item.unidad)
  // Sal, pimienta y las pizcas no se compran cada semana.
  if (unidad === 'al gusto') return 0

  const entrada = buscarPrecio(item.nombre)
  if (!entrada) return null

  const dim = dimension(entrada.unidad)
  if (!dim) return null

  // A la unidad pequeña (g, ml, ud) antes de multiplicar. Al revés no vale:
  // convertir() redondea a dos decimales y 25 g en kg salen 0,03, precio inflado.
  const porBase = convertir(1, entrada.unidad, dim)
  if (porBase == null || porBase === 0) return null
  const eurosPorBase = entrada.euros / porBase

  const cantidadBase = enUnidadBase(item.cantidad, unidad, dim, entrada)
  return cantidadBase == null ? null : redondearCentimos(cantidadBase * eurosPorBase)
}

function enUnidadBase(
  cantidad: number,
  unidad: string,
  dim: 'g' | 'ml' | 'ud',
  entrada: EntradaPrecio
): number | null {
  const directa = convertir(cantidad, unidad, dim)
  if (directa != null) return directa

  // "2 contramuslos" de algo que se vende por kilo.
  if (normalizar(unidad) === 'ud' && dim === 'g' && entrada.gramosPorUd) {
    return cantidad * entrada.gramosPorUd
  }

  if (dim === 'ud') return null
  const enBase = COCINA[normalizar(unidad)]?.[dim]
  return enBase == null ? null : cantidad * enBase
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
  const sinPrecio: string[] = []
  for (const item of items) {
    const precio = precioDe(item)
    if (precio == null) sinPrecio.push(item.nombre)
    else total += precio
  }
  return { total: redondearCentimos(total), sinPrecio }
}
