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

/** Lo que se supone que se vara de un perecedero cuyo envase no está anotado. */
export const VARADO_SUPUESTO = 0.35

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

interface Pedido {
  ing: Ingrediente
  /** Lo que piden entre todos los platos, en la unidad del envase. */
  base: number
  envase: Envase
  riesgo: number
}

/** Lo que la semana lleva pedido, para poder preguntar qué añade un plato más. */
export type Cesta = Map<string, Pedido>

export const cestaVacia = (): Cesta => new Map()

interface ConIngredientes {
  ingredientes: Ingrediente[]
  guarnicion?: { ingredientes: Ingrediente[] } | null
}

const lineasDe = (plato: ConIngredientes): Ingrediente[] =>
  [...plato.ingredientes, ...(plato.guarnicion?.ingredientes ?? [])]

/** Lo que se tira de una línea de la cesta: lo que sobra del envase, si se pierde. */
function tiradoDe(pedido: Pedido): number {
  if (pedido.base <= 0 || pedido.riesgo === 0) return 0
  const { envase, base } = pedido
  const envases = Math.ceil(base / envase.cantidad)
  return (envases - base / envase.cantidad) * envase.euros * pedido.riesgo
}

/** Mete un plato en la cesta. `omitir` deja fuera lo que ya está en casa. */
export function anadirALaCesta(
  cesta: Cesta,
  plato: ConIngredientes,
  omitir?: (nombre: string) => boolean
): void {
  for (const ing of lineasDe(plato)) {
    if (omitir?.(ing.nombre)) continue
    const envase = envaseDe(ing.nombre)
    if (!envase) continue
    const cantidad = enBase(ing.cantidad, ing.nombre, ing.unidad, envase.unidad)
    if (cantidad == null || cantidad <= 0) continue
    const clave = claveNombre(ing.nombre)
    const prev = cesta.get(clave)
    if (prev) prev.base += cantidad
    else cesta.set(clave, { ing, base: cantidad, envase, riesgo: riesgoDe(ing) })
  }
}

export interface LoQueAnade {
  /** Euros de envase que este plato deja sin usar, de más o de menos. */
  basura: number
  /** Euros de envase nuevo que hay que comprar por él. */
  compra: number
}

/**
 * Qué le hace a la cesta meter este plato, sin meterlo.
 *
 * La basura baja cuando el plato se come lo que ya estaba abierto y sobraba, y
 * sube cuando abre un envase nuevo de algo que no llega a la próxima compra.
 */
export function loQueAnade(cesta: Cesta, plato: ConIngredientes, omitir?: (nombre: string) => boolean): LoQueAnade {
  const suma = new Map<string, { ing: Ingrediente; cantidad: number; envase: Envase }>()
  let basura = 0
  let compra = 0

  for (const ing of lineasDe(plato)) {
    if (omitir?.(ing.nombre)) continue
    const envase = envaseDe(ing.nombre)
    if (!envase) {
      // Sin envase anotado no hay euros que contar, pero abrirlo sigue dejando
      // sobra: cuenta como una suposición, y lo ya abierto no añade nada.
      if (!cesta.has(claveNombre(ing.nombre))) {
        basura += VARADO_SUPUESTO * riesgoDe(ing)
        compra += VARADO_SUPUESTO
      }
      continue
    }
    const cantidad = enBase(ing.cantidad, ing.nombre, ing.unidad, envase.unidad)
    if (cantidad == null || cantidad <= 0) continue
    const clave = claveNombre(ing.nombre)
    const prev = suma.get(clave)
    if (prev) prev.cantidad += cantidad
    else suma.set(clave, { ing, cantidad, envase })
  }

  for (const [clave, { ing, cantidad, envase }] of suma) {
    const antes = cesta.get(clave)
    const base = (antes?.base ?? 0) + cantidad
    const riesgo = antes?.riesgo ?? riesgoDe(ing)
    basura += tiradoDe({ ing, base, envase, riesgo }) - (antes ? tiradoDe(antes) : 0)
    const envasesAntes = antes ? Math.ceil(antes.base / envase.cantidad) : 0
    compra += (Math.ceil(base / envase.cantidad) - envasesAntes) * envase.euros
  }

  return { basura, compra }
}

/**
 * Qué parte de lo que hay que comprar por este plato se va a la basura, de 0 a 1.
 *
 * En fracción y no en euros a propósito: en euros, la manera más fácil de no
 * tirar nada es comprar menos comida, y una semana que compra la mitad no es
 * una semana mejor. En fracción, un plato con cuatro verduras que se acaban va
 * igual de bien que uno sin verdura ninguna, y mal solo el que deja media bolsa.
 */
export function fraccionQueSeTira(cesta: Cesta, plato: ConIngredientes, omitir?: (nombre: string) => boolean): number {
  const { basura, compra } = loQueAnade(cesta, plato, omitir)
  if (compra <= 0) return 0
  return Math.max(0, Math.min(1, basura / compra))
}

/** Qué cuesta de verdad una lista de platos: envases enteros, no cucharadas. */
export function cuentaDeLaCompra(platos: ConIngredientes[]): Cuenta {
  const cesta = cestaVacia()
  const sinEnvase = new Set<string>()
  for (const plato of platos) {
    for (const ing of lineasDe(plato)) {
      const envase = envaseDe(ing.nombre)
      const cantidad = envase ? enBase(ing.cantidad, ing.nombre, ing.unidad, envase.unidad) : null
      if (cantidad == null) sinEnvase.add(ing.nombre)
    }
    anadirALaCesta(cesta, plato)
  }

  let pagado = 0, comido = 0, tirado = 0
  const lineas: LineaCuenta[] = []
  for (const [, item] of cesta) {
    if (item.base <= 0) continue
    const envases = Math.ceil(item.base / item.envase.cantidad)
    const pago = envases * item.envase.euros
    const como = (item.base / item.envase.cantidad) * item.envase.euros
    const sobra = tiradoDe(item)
    pagado += pago; comido += como; tirado += sobra
    lineas.push({
      nombre: item.ing.nombre, necesita: item.base, envase: item.envase.cantidad,
      envases, pagado: pago, tirado: sobra, dias: diasDeLaSobra(item.ing.nombre, item.ing.familia),
    })
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
