// Matching entre nombres de ingrediente (despensa ↔ recetas ↔ lista) y
// cálculo de disponibilidad. El problema real: la despensa se escribe a mano
// ("aceite oliva", "pollo") mientras las recetas usan nombres de cocina
// precisos ("aceite de oliva", "pechuga de pollo"). Un match exacto deja 0
// recetas disponibles con la despensa llena. Se compara por conjuntos de
// tokens ignorando conectores ("de"), acentos y plurales, con contención
// direccional: un ingrediente genérico de la despensa cubre uno específico de
// la receta y viceversa.

import { normalizar, canonUnidad } from './ingredientes'
import { aplicarAlias } from './alias'
import type { Receta } from '../types/receta'

export const FAMILIAS = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lácteos',
  'cereales', 'legumbres', 'conservas', 'especias', 'salsas', 'bebidas', 'otros',
]

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
const CABEZAS_AMBIGUAS = new Set(['aceite', 'leche', 'salsa', 'vino', 'vinagre', 'caldo', 'harina', 'pasta', 'crema'])

function singular(t: string): string {
  if (t.length > 3 && t.endsWith('es')) return t.slice(0, -2)
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1)
  return t
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

// Cobertura de un ingrediente de la lista de compra por la despensa. La
// despensa no guarda cantidades, así que "nos falta cantidad" se traduce en
// estado 'poco' o caducidad encima: se compra entero pero avisando de que
// queda algo en casa.
export type CoberturaDespensa = 'cubierto' | 'poco' | 'no'

export function coberturaDespensa(
  nombre: string,
  despensa: { nombre: string; estado: string; caducidad?: string }[]
): CoberturaDespensa {
  const match = despensa.find((d) => despensaCubre(d.nombre, nombre))
  if (!match) return 'no'
  return match.estado === 'poco' || caducaPronto(match) ? 'poco' : 'cubierto'
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
