import type { Ingrediente, Receta } from '../types/receta'
import { ALIAS_NOMBRES } from './alias'

export function ingredientesDe(
  receta: Pick<Receta, 'ingredientes' | 'guarnicion'>,
  conGuarnicion?: boolean
): Ingrediente[] {
  if (!conGuarnicion || !receta.guarnicion) return receta.ingredientes
  return [...receta.ingredientes, ...receta.guarnicion.ingredientes]
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

export function canonNombre(nombre: string): string {
  return ALIAS_NOMBRES[normalizar(nombre)] ?? nombre
}

const UNIDAD_CANON: Record<string, string> = {
  cda: 'cucharada', cdas: 'cucharada', cucharadas: 'cucharada',
  cdta: 'cucharadita', cdtas: 'cucharadita', cucharaditas: 'cucharadita',
  dientes: 'diente', hojas: 'hoja', lonchas: 'loncha', rodajas: 'rodaja',
  rebanadas: 'rebanada', unidad: 'ud', unidades: 'ud', uds: 'ud',
  gr: 'g', grs: 'g', gramos: 'g', mililitros: 'ml',
  punado: 'puñado', punados: 'puñado',
  pizcas: 'pizca', gotas: 'gota', tiras: 'tira', latas: 'lata', paquetes: 'paquete',
  vasos: 'vaso',
}

const AL_GUSTO = new Set(['sal', 'pimienta', 'sal y pimienta', 'sal y pimienta al gusto'])

export function canonUnidad(nombre: string, unidad: string): string {
  if (AL_GUSTO.has(normalizar(nombre))) return 'al gusto'
  const k = normalizar(unidad)
  if (k === 'pizca' || k === 'al gusto') return 'al gusto'
  return UNIDAD_CANON[k] ?? k
}

export function claveIngrediente(nombre: string, unidad: string): string {
  return `${normalizar(nombre)}__${canonUnidad(nombre, unidad)}`
}

const PIEZAS = new Set(['ud', 'lata', 'paquete'])

export function cantidadDeCompra(cantidad: number, unidad: string): number {
  return PIEZAS.has(unidad) ? Math.ceil(cantidad) : cantidad
}

const FRACCIONES: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔' }

export function formatNumero(n: number): string {
  const entero = Math.floor(n)
  const dec = +(n - entero).toFixed(2)
  if (dec === 0) return String(entero)
  const frac = FRACCIONES[String(dec)]
  if (frac) return entero > 0 ? `${entero}${frac}` : frac
  return String(+n.toFixed(2))
}

export function formatCantidad(cantidad: number, unidad: string): string {
  if (unidad === 'al gusto') return 'al gusto'
  if (unidad === 'ud') return formatNumero(cantidad)
  return `${formatNumero(cantidad)} ${unidad}`
}
