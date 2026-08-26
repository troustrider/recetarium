/**
 * Lo que se paga contra lo que se come.
 *
 * Compartir se venía puntuando por lo raro que era el ingrediente en el
 * recetario, y lo raro no es lo que se tira: la canela sale en pocas recetas y
 * el tarro dura dos años, mientras que el cilantro sale en muchas y se pudre en
 * cinco días. Lo que se tira es el envase que hay que comprar entero, se usa a
 * cucharadas y no llega a la semana siguiente.
 *
 * El envase sale de `formato` en precios.json ("tarro 350 g · 2,45 €"), que ya
 * se venía anotando para poder repetir la comprobación en tienda.
 */
import { normalizar, claveNombre, canonUnidad } from './ingredientes'
import { convertir } from './cantidades'
import { PRECIOS, buscarPrecio } from './precios'
import { diasEstimados } from './caducidadEstimada'
import { diasTrasAbrir } from './trasAbrir'
import type { Ingrediente } from '../types/receta'

export interface Envase {
  /** Tamaño del envase en su unidad base. */
  cantidad: number
  unidad: 'g' | 'ml'
  /** Lo que cuesta comprar uno. */
  euros: number
}

const RE_FORMATO = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b(?:[^·]*·\s*(\d+(?:[.,]\d+)?)\s*€)?/i

/** Lee "tarro 350 g · 2,45 €" y devuelve el envase real. */
export function envaseDeFormato(formato: string, euros: number, unidadPrecio: string): Envase | null {
  const m = RE_FORMATO.exec(formato)
  if (!m) return null
  const unidad = m[2].toLowerCase()
  const dim: 'g' | 'ml' = unidad === 'kg' || unidad === 'g' ? 'g' : 'ml'
  const enBase = convertir(parseFloat(m[1].replace(',', '.')), unidad, dim)
  if (enBase == null || enBase <= 0) return null

  if (m[3]) return { cantidad: enBase, unidad: dim, euros: parseFloat(m[3].replace(',', '.')) }
  const porBase = convertir(1, unidadPrecio, dim)
  if (porBase == null || porBase === 0) return null
  return { cantidad: enBase, unidad: dim, euros: (euros / porBase) * enBase }
}

const CACHE_ENVASE = new Map<string, Envase | null>()

export function envaseDe(nombre: string): Envase | null {
  const clave = claveNombre(nombre)
  const guardado = CACHE_ENVASE.get(clave)
  if (guardado !== undefined) return guardado
  const entrada = buscarPrecio(nombre)
  const envase = entrada?.formato ? envaseDeFormato(entrada.formato, entrada.euros, entrada.unidad) : null
  CACHE_ENVASE.set(clave, envase)
  return envase
}

const COCINA: Record<string, number> = {
  cucharada: 12, cucharadita: 4, vaso: 180, puñado: 25, punado: 25, diente: 5,
  hoja: 0.5, loncha: 20, rodaja: 15, rebanada: 30, tira: 30, lata: 400, paquete: 250,
}

/** Cuánto pide una línea de receta, en gramos o mililitros. */
export function enBase(cantidad: number, nombre: string, unidad: string, dim: 'g' | 'ml'): number | null {
  const u = canonUnidad(nombre, unidad)
  if (u === 'al gusto') return 0
  const directa = convertir(cantidad, u, dim)
  if (directa != null) return directa
  const cocina = COCINA[normalizar(u)]
  if (cocina != null) return cantidad * cocina
  const entrada = buscarPrecio(nombre)
  if (u === 'ud' && entrada?.gramosPorUd) return cantidad * entrada.gramosPorUd
  return null
}

/** Lo que sobra de un perecedero no llega al siguiente plan. */
export const DIAS_HASTA_LA_PROXIMA_COMPRA = 7

/** Pasado esto, lo que sobra es fondo de armario y se acaba gastando. */
const DIAS_FONDO_DE_ARMARIO = 90

/**
 * Los días que le quedan a lo que sobra. Manda el reloj del envase abierto: el
 * brik de leche de coco caduca dentro de un año sin abrir y dura tres días
 * abierto, y lo que sobra de un plato está abierto por definición.
 */
export function diasDeLaSobra(nombre: string, familia: string): number | null {
  const abierto = diasTrasAbrir(nombre, familia)
  const cerrado = diasEstimados(nombre, familia)
  if (abierto == null) return cerrado
  return cerrado == null ? abierto : Math.min(abierto, cerrado)
}

/** Los euros del envase que este plato deja sin usar. */
export function varadoDe(ing: Ingrediente): number {
  const envase = envaseDe(ing.nombre)
  if (!envase) return 0
  const cantidad = enBase(ing.cantidad, ing.nombre, ing.unidad, envase.unidad)
  if (cantidad == null || cantidad <= 0) return 0
  const envases = Math.ceil(cantidad / envase.cantidad)
  return Math.max(0, envases * envase.euros - (cantidad / envase.cantidad) * envase.euros)
}

/**
 * Qué parte de lo varado se pierde de verdad: 1 lo que no llega a la próxima
 * compra, 0 el bote que espera en el armario, y una rampa en medio para lo que
 * aguanta semanas pero rara vez se acaba —el tarro de tahini, la harissa.
 */
export function riesgoDe(ing: Ingrediente): number {
  const dias = diasDeLaSobra(ing.nombre, ing.familia)
  if (dias == null) return 0
  if (dias <= DIAS_HASTA_LA_PROXIMA_COMPRA) return 1
  if (dias >= DIAS_FONDO_DE_ARMARIO) return 0
  return (DIAS_FONDO_DE_ARMARIO - dias) / (DIAS_FONDO_DE_ARMARIO - DIAS_HASTA_LA_PROXIMA_COMPRA)
}

/**
 * Lo que se pierde si un solo plato de la semana pide este ingrediente: el
 * resto del envase, descontado lo que sí se acabará otro día. Es exactamente lo
 * que rescata meter un segundo plato que lo use.
 */
export function desperdicioDe(ing: Ingrediente): number {
  return varadoDe(ing) * riesgoDe(ing)
}

export const COBERTURA_ENVASES = () => ({
  total: PRECIOS.length,
  con: PRECIOS.filter((p) => p.formato && envaseDeFormato(p.formato, p.euros, p.unidad)).length,
})

export interface LineaCuenta {
  nombre: string
  /** Lo que piden entre todos los platos, en la unidad del envase. */
  necesita: number
  envase: number
  envases: number
  pagado: number
  /** Lo que sobra y no llega a gastarse. */
  tirado: number
  dias: number | null
}

export interface Cuenta {
  /** Lo que hay que pagar: envases enteros. */
  pagado: number
  /** Lo que se come de verdad. */
  comido: number
  /** Lo que sobra de los perecederos y no llega a gastarse. */
  tirado: number
  /** Ingredientes de los que no se sabe el envase: no entran en la cuenta. */
  sinEnvase: string[]
  lineas: LineaCuenta[]
}

/** Qué cuesta de verdad una lista de platos: envases enteros, no cucharadas. */
export function cuentaDeLaCompra(platos: { ingredientes: Ingrediente[]; guarnicion?: { ingredientes: Ingrediente[] } | null }[]): Cuenta {
  const pedido = new Map<string, { ing: Ingrediente; base: number }>()
  const sinEnvase = new Set<string>()

  for (const plato of platos) {
    for (const ing of [...plato.ingredientes, ...(plato.guarnicion?.ingredientes ?? [])]) {
      const envase = envaseDe(ing.nombre)
      if (!envase) { sinEnvase.add(ing.nombre); continue }
      const cantidad = enBase(ing.cantidad, ing.nombre, ing.unidad, envase.unidad)
      if (cantidad == null) { sinEnvase.add(ing.nombre); continue }
      const clave = claveNombre(ing.nombre)
      const prev = pedido.get(clave)
      if (prev) prev.base += cantidad
      else pedido.set(clave, { ing, base: cantidad })
    }
  }

  let pagado = 0, comido = 0, tirado = 0
  const lineas: LineaCuenta[] = []
  for (const [, item] of pedido) {
    if (item.base <= 0) continue
    const envase = envaseDe(item.ing.nombre)!
    const envases = Math.ceil(item.base / envase.cantidad)
    const pago = envases * envase.euros
    const como = (item.base / envase.cantidad) * envase.euros
    const dias = diasDeLaSobra(item.ing.nombre, item.ing.familia)
    // Lo que sobra de un no perecedero se guarda y se gasta otro día; lo del
    // perecedero se pierde, y solo eso cuenta.
    const sobra = (pago - como) * riesgoDe({ ...item.ing, cantidad: item.base, unidad: envase.unidad })
    pagado += pago; comido += como; tirado += sobra
    lineas.push({ nombre: item.ing.nombre, necesita: item.base, envase: envase.cantidad, envases, pagado: pago, tirado: sobra, dias })
  }

  const céntimos = (n: number) => Math.round(n * 100) / 100
  return {
    pagado: céntimos(pagado),
    comido: céntimos(comido),
    tirado: céntimos(tirado),
    sinEnvase: [...sinEnvase],
    lineas: lineas.sort((a, b) => b.tirado - a.tirado),
  }
}
