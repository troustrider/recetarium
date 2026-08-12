import { normalizar, canonUnidad } from './ingredientes'
import { convertir, redondear, unidadMedible } from './cantidades'
import { ALIAS_TOKENS } from './alias'
import type { Receta } from '../types/receta'

export const FAMILIA_HOGAR = 'hogar'

export const FAMILIAS = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lácteos', 'huevos',
  'cereales', 'legumbres', 'frutos secos', 'conservas', 'especias', 'condimentos', 'salsas', 'bebidas', FAMILIA_HOGAR, 'otros',
]

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

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'al', 'con', 'en', 'y', 'a', 'para', 'sin', 'o'])

const DESCRIPTORES = new Set([
  'fresco', 'fresca', 'congelado', 'congelada', 'congelados', 'congeladas',
  'seco', 'seca', 'molido', 'molida', 'picado', 'picada', 'rallado', 'rallada',
  'cocido', 'cocida', 'cocidos', 'cocidas', 'natural', 'virgen', 'extra',
  'bote', 'lata', 'enlatado', 'ahumada', 'ahumado', 'tamizado', 'tamizada',
  'semi', 'desnatado', 'desnatada', 'entera', 'entero', 'integral', 'baja',
  'planos', 'finas', 'fina', 'variadas',
])

const CABEZAS_AMBIGUAS_NOMBRES = ['aceite', 'leche', 'salsa', 'vino', 'vinagre', 'caldo', 'harina', 'pasta', 'crema', 'col']

function singular(t: string): string {
  if (t.length > 4 && t.endsWith('ces')) return `${t.slice(0, -3)}z` // nueces → nuez
  let s = t
  if (s.length > 3 && s.endsWith('es')) s = s.slice(0, -2)
  else if (s.length > 3 && s.endsWith('s')) s = s.slice(0, -1)
  return s.length > 3 && s.endsWith('e') ? s.slice(0, -1) : s
}

const ALIAS_RAIZ = new Map(Object.entries(ALIAS_TOKENS).map(([k, v]) => [singular(k), singular(v)]))
const CABEZAS_AMBIGUAS = new Set(CABEZAS_AMBIGUAS_NOMBRES.map(singular))

function aplicarAlias(token: string): string {
  return ALIAS_RAIZ.get(token) ?? token
}

const TOPE_CACHE = 4000

function memoizar<V>(cache: Map<string, V>, clave: string, calcular: () => V): V {
  const hit = cache.get(clave)
  if (hit !== undefined) return hit
  const valor = calcular()
  if (cache.size >= TOPE_CACHE) cache.clear()
  cache.set(clave, valor)
  return valor
}

const cacheTokens = new Map<string, string[]>()
const cacheNucleo = new Map<string, Set<string>>()

function tokens(nombre: string): string[] {
  return memoizar(cacheTokens, nombre, () =>
    normalizar(nombre)
      .replace(/[()]/g, ' ')
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t && !STOPWORDS.has(t))
      .map(singular)
      .map(aplicarAlias)
  )
}

function nucleo(nombre: string): Set<string> {
  return memoizar(cacheNucleo, nombre, () => {
    const t = tokens(nombre)
    const sinDesc = t.filter((x) => !DESCRIPTORES.has(x))
    return new Set(sinDesc.length ? sinDesc : t)
  })
}

export function nucleoOrdenado(nombre: string): string[] {
  return [...nucleo(nombre)]
}

function esSuperset(a: Set<string>, b: Set<string>): boolean {
  if (b.size === 0 || b.size > a.size) return false
  for (const x of b) if (!a.has(x)) return false
  return true
}

export function despensaCubre(enDespensa: string, deReceta: string): boolean {
  const p = nucleo(enDespensa)
  const r = nucleo(deReceta)
  if (p.size === 0 || r.size === 0) return normalizar(enDespensa) === normalizar(deReceta)
  if (esSuperset(p, r)) return true // iguales o despensa más específica
  if (esSuperset(r, p)) {
    return !(p.size === 1 && CABEZAS_AMBIGUAS.has([...p][0]))
  }
  return false
}

export function mismoIngrediente(a: string, b: string): boolean {
  const ta = tokens(a)
  const tb = new Set(tokens(b))
  return ta.length > 0 && ta.length === tb.size && ta.every((t) => tb.has(t))
}

export function estaEnDespensa(nombre: string, despensa: { nombre: string }[]): boolean {
  return despensa.some((d) => mismoIngrediente(d.nombre, nombre))
}

export function faltantes(receta: Receta, despensa: { nombre: string }[]): string[] {
  return receta.ingredientes
    .filter((ing) => canonUnidad(ing.nombre, ing.unidad) !== 'al gusto')
    .filter((ing) => !despensa.some((d) => despensaCubre(d.nombre, ing.nombre)))
    .map((ing) => ing.nombre)
}

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

export function repartirDespensa(items: ItemCompra[], despensa: ItemDespensa[]): Reparto[] {
  const restante = despensa.map((d) =>
    typeof d.cantidad === 'number' && unidadMedible(d.unidad) ? d.cantidad : null
  )

  const agotado = (d: ItemDespensa, stock: number | null, item: ItemCompra) => {
    if (stock == null) return false
    const disponible = convertir(stock, d.unidad!, item.unidad)
    return disponible != null && disponible <= 0
  }

  const puntuar = (d: ItemDespensa, stock: number | null, item: ItemCompra) =>
    (agotado(d, stock, item) ? 0 : 16) +
    (mismoIngrediente(d.nombre, item.nombre) ? 8 : 0) +
    (d.estado !== 'poco' ? 2 : 0) +
    (caducaPronto(d) ? 0 : 1)

  return items.map((item) => {
    let idx = -1
    let mejor = -1
    for (let i = 0; i < despensa.length; i++) {
      if (!despensaCubre(despensa[i].nombre, item.nombre)) continue
      const p = puntuar(despensa[i], restante[i], item)
      if (p > mejor) {
        mejor = p
        idx = i
      }
    }
    if (idx === -1) return { cobertura: 'no', aComprar: item.cantidad, yaTengo: 0 }

    const d = despensa[idx]
    const stock = restante[idx]
    const disponible = stock == null ? null : convertir(stock, d.unidad!, item.unidad)

    if (disponible == null) {
      const poco = d.estado === 'poco' || caducaPronto(d)
      return { cobertura: poco ? 'poco' : 'cubierto', aComprar: item.cantidad, yaTengo: 0 }
    }
    if (disponible <= 0) return { cobertura: 'no', aComprar: item.cantidad, yaTengo: 0 }

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
