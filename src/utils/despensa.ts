// Matching entre nombres de ingrediente (despensa ↔ recetas ↔ lista) y
// cálculo de disponibilidad. El problema real: la despensa se escribe a mano
// ("aceite oliva", "pollo") mientras las recetas usan nombres de cocina
// precisos ("aceite de oliva", "pechuga de pollo"). Un match exacto deja 0
// recetas disponibles con la despensa llena. Se compara por conjuntos de
// tokens ignorando conectores ("de"), acentos y plurales, con contención
// direccional: un ingrediente genérico de la despensa cubre uno específico de
// la receta y viceversa.

import { normalizar, canonUnidad } from './ingredientes'
import { convertir, redondear, unidadMedible } from './cantidades'
import { ALIAS_TOKENS } from './alias'
import type { Receta } from '../types/receta'

export const FAMILIA_HOGAR = 'hogar'

export const FAMILIAS = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lácteos', 'huevos',
  'cereales', 'legumbres', 'frutos secos', 'conservas', 'especias', 'condimentos', 'salsas', 'bebidas', FAMILIA_HOGAR, 'otros',
]

// Limpieza, higiene y papel: se compran con la lista pero no son ingredientes,
// así que al marcarlos como comprados salen de la lista sin entrar en la
// despensa. La familia manda; las pistas por nombre solo evitan tener que
// elegir la sección a mano en lo más habitual.
const PISTAS_HOGAR = [
  'detergente', 'suavizante', 'lejia', 'lavavajillas', 'friegasuelos', 'limpiacristales',
  'quitagrasas', 'ambientador', 'insecticida', 'estropajo', 'bayeta', 'fregona',
  'papel higienico', 'papel de cocina', 'servilleta', 'bolsa de basura', 'bolsas de basura',
  'film transparente', 'papel de aluminio', 'papel aluminio', 'papel de horno',
  'jabon', 'gel de ducha', 'champu', 'acondicionador', 'pasta de dientes',
  'cepillo de dientes', 'desodorante', 'cuchilla', 'maquinilla', 'panuelos',
  'compresa', 'tampon', 'algodon', 'bastoncillo', 'pilas',
]

export function esDeHogar(item: { nombre: string; familia?: string }): boolean {
  if (item.familia === FAMILIA_HOGAR) return true
  const n = normalizar(item.nombre)
  return PISTAS_HOGAR.some((p) => n.includes(p))
}

// Conectores sin valor semántico ("aceite DE oliva", "huevo Y queso").
const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'al', 'con', 'en', 'y', 'a', 'para', 'sin', 'o'])

// Descriptores que no cambian la identidad del ingrediente: "brócoli
// congelado" sigue siendo brócoli, "carne picada" sigue siendo carne. Se
// ignoran para la contención pero NO para la igualdad (dedup de despensa).
const DESCRIPTORES = new Set([
  'fresco', 'fresca', 'congelado', 'congelada', 'congelados', 'congeladas',
  'seco', 'seca', 'molido', 'molida', 'picado', 'picada', 'rallado', 'rallada',
  'cocido', 'cocida', 'cocidos', 'cocidas', 'natural', 'virgen', 'extra',
  'bote', 'lata', 'enlatado', 'ahumada', 'ahumado', 'tamizado', 'tamizada',
  'semi', 'desnatado', 'desnatada', 'entera', 'entero', 'integral', 'baja',
  'planos', 'finas', 'fina', 'variadas',
])

// "Cabezas" cuyo calificador denota un producto distinto: aceite de oliva ≠
// aceite de girasol, leche ≠ leche de coco, salsa de soja ≠ salsa de pescado.
// Un genérico de la despensa (solo la cabeza) NO cubre al específico de receta.
const CABEZAS_AMBIGUAS_NOMBRES = ['aceite', 'leche', 'salsa', 'vino', 'vinagre', 'caldo', 'harina', 'pasta', 'crema', 'col']

// Raíz común de singular y plural. No intenta acertar el singular real: "-es"
// es ambiguo en español ("limones" viene de limón, pero "tomates" de tomate) y
// sin diccionario no se distingue. Lo que sí se puede es llevar las dos formas
// al mismo sitio quitando también la "e" final, que es lo único que separaba
// "tomate" de "tomat(es)".
function singular(t: string): string {
  if (t.length > 4 && t.endsWith('ces')) return `${t.slice(0, -3)}z` // nueces → nuez
  let s = t
  if (s.length > 3 && s.endsWith('es')) s = s.slice(0, -2)
  else if (s.length > 3 && s.endsWith('s')) s = s.slice(0, -1)
  return s.length > 3 && s.endsWith('e') ? s.slice(0, -1) : s
}

// Las dos tablas de arriba se escriben en singular natural ("leche", "cabbage"),
// pero los tokens llegan ya reducidos a raíz. Se derivan con la misma función
// para que sigan casando sin tener que reescribirlas a mano.
const ALIAS_RAIZ = new Map(Object.entries(ALIAS_TOKENS).map(([k, v]) => [singular(k), singular(v)]))
const CABEZAS_AMBIGUAS = new Set(CABEZAS_AMBIGUAS_NOMBRES.map(singular))

function aplicarAlias(token: string): string {
  return ALIAS_RAIZ.get(token) ?? token
}

// Tokens significativos: normalizados, sin conectores, en singular y con los
// alias resueltos ("ketjap" → "kecap") para que sinónimos y variantes de
// escritura casen igual que el resto.
function tokens(nombre: string): string[] {
  return normalizar(nombre)
    .replace(/[()]/g, ' ')
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t))
    .map(singular)
    .map(aplicarAlias)
}

// Núcleo: tokens sin descriptores. Es lo que define la identidad del
// ingrediente para decidir si uno cubre a otro.
function nucleo(nombre: string): Set<string> {
  const t = tokens(nombre)
  const sinDesc = t.filter((x) => !DESCRIPTORES.has(x))
  return new Set(sinDesc.length ? sinDesc : t)
}

const esSuperset = (a: Set<string>, b: Set<string>) => b.size > 0 && [...b].every((x) => a.has(x))

// ¿El ingrediente `enDespensa` sirve para el `deReceta`? Contención en ambas
// direcciones: la despensa puede ser más específica ("arroz jasmine" cubre
// "arroz") o más genérica ("pollo" cubre "pechuga de pollo"), salvo cuando el
// genérico es una cabeza ambigua (una leche cualquiera no cubre leche de coco).
export function despensaCubre(enDespensa: string, deReceta: string): boolean {
  const p = nucleo(enDespensa)
  const r = nucleo(deReceta)
  if (p.size === 0 || r.size === 0) return normalizar(enDespensa) === normalizar(deReceta)
  if (esSuperset(p, r) && esSuperset(r, p)) return true // iguales
  if (esSuperset(p, r)) return true // despensa más específica
  if (esSuperset(r, p)) {
    // despensa más genérica: bloquear si es una cabeza que cambia de producto
    return !(p.size === 1 && CABEZAS_AMBIGUAS.has([...p][0]))
  }
  return false
}

// Mismo ingrediente (simétrico): para deduplicar despensa y cruzar con la lista
// de la compra. Igualdad de tokens completos (incluidos descriptores) para no
// fundir "arroz" con "arroz integral", pero tolerando conectores y plurales.
export function mismoIngrediente(a: string, b: string): boolean {
  const ta = tokens(a)
  const tb = new Set(tokens(b))
  return ta.length > 0 && ta.length === tb.size && ta.every((t) => tb.has(t))
}

export function estaEnDespensa(nombre: string, despensa: { nombre: string }[]): boolean {
  return despensa.some((d) => mismoIngrediente(d.nombre, nombre))
}

// Ingredientes de la receta que la despensa no cubre. Los "al gusto"
// (sal, pimienta, especias de pizca) se asumen básicos de casa y no cuentan.
export function faltantes(receta: Receta, despensa: { nombre: string }[]): string[] {
  return receta.ingredientes
    .filter((ing) => canonUnidad(ing.nombre, ing.unidad) !== 'al gusto')
    .filter((ing) => !despensa.some((d) => despensaCubre(d.nombre, ing.nombre)))
    .map((ing) => ing.nombre)
}

// Cobertura de un ingrediente de la lista de compra por la despensa:
//   cubierto — hay bastante, no se compra
//   parcial  — hay algo, se compra solo la diferencia
//   poco     — hay, pero sin cantidad fiable (marcado "poco" o caducando):
//              se compra entero avisando de que queda algo en casa
//   no       — no hay
export type CoberturaDespensa = 'cubierto' | 'parcial' | 'poco' | 'no'

export interface ItemCompra {
  nombre: string
  cantidad: number
  unidad: string
}

export interface Reparto {
  cobertura: CoberturaDespensa
  aComprar: number // en la unidad del ítem de la lista
  yaTengo: number // idem; 0 cuando no hay cantidad que descontar
}

interface ItemDespensa {
  nombre: string
  estado: string
  caducidad?: string
  cantidad?: number
  unidad?: string
}

// Reparte el stock de la despensa entre los ingredientes de la lista, en
// orden. Un mismo ingrediente de despensa ("pollo") puede cubrir varias
// entradas ("pechuga", "muslo"): se le va descontando para no contarlo dos
// veces. Cuando no hay cantidad guardada, o la unidad de la receta no es
// comparable ("2 cucharadas" contra "500 ml"), se cae al criterio por estado.
export function repartirDespensa(items: ItemCompra[], despensa: ItemDespensa[]): Reparto[] {
  const restante = despensa.map((d) =>
    typeof d.cantidad === 'number' && unidadMedible(d.unidad) ? d.cantidad : null
  )

  return items.map((item) => {
    const idx = despensa.findIndex((d) => despensaCubre(d.nombre, item.nombre))
    if (idx === -1) return { cobertura: 'no', aComprar: item.cantidad, yaTengo: 0 }

    const d = despensa[idx]
    const stock = restante[idx]
    const disponible = stock == null ? null : convertir(stock, d.unidad!, item.unidad)

    if (disponible == null) {
      const poco = d.estado === 'poco' || caducaPronto(d)
      return { cobertura: poco ? 'poco' : 'cubierto', aComprar: item.cantidad, yaTengo: 0 }
    }
    if (disponible <= 0) return { cobertura: 'no', aComprar: item.cantidad, yaTengo: 0 }

    // Con cantidad explícita manda la cantidad, pero la caducidad sigue
    // obligando a reponer aunque el stock diera de sobra.
    if (disponible >= item.cantidad) {
      if (caducaPronto(d)) return { cobertura: 'poco', aComprar: item.cantidad, yaTengo: 0 }
      restante[idx] = redondear(stock! - convertir(item.cantidad, item.unidad, d.unidad!)!)
      return { cobertura: 'cubierto', aComprar: 0, yaTengo: item.cantidad }
    }

    restante[idx] = 0
    return {
      cobertura: 'parcial',
      aComprar: redondear(item.cantidad - disponible),
      yaTengo: disponible,
    }
  })
}

export function diasHastaCaducidad(caducidad: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((new Date(`${caducidad}T00:00:00`).getTime() - hoy.getTime()) / 86400000)
}

export const UMBRAL_CADUCIDAD_DIAS = 3

export function caducaPronto(item: { caducidad?: string }): boolean {
  return item.caducidad != null && diasHastaCaducidad(item.caducidad) <= UMBRAL_CADUCIDAD_DIAS
}

// Lo que se está acabando: marcado como "poco" o con caducidad encima.
export function porAgotarse<T extends { estado: string; caducidad?: string }>(despensa: T[]): T[] {
  return despensa.filter((d) => d.estado === 'poco' || caducaPronto(d))
}

export interface InfoCaducidad {
  dias: number
  label: string
  urgente: boolean // hoy, mañana o ya caducado
  pronto: boolean // dentro del umbral de aviso
}

export function infoCaducidad(caducidad?: string): InfoCaducidad | null {
  if (!caducidad) return null
  const dias = diasHastaCaducidad(caducidad)
  const label =
    dias < 0 ? 'caducado'
    : dias === 0 ? 'caduca hoy'
    : dias === 1 ? 'caduca mañana'
    : `caduca en ${dias}d`
  return { dias, label, urgente: dias <= 1, pronto: dias <= UMBRAL_CADUCIDAD_DIAS }
}
