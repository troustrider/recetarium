import { normalizar } from './ingredientes'

export const UNIDADES_DESPENSA = ['g', 'kg', 'ml', 'l', 'ud'] as const

type Base = 'g' | 'ml' | 'ud'

const EQUIVALENCIAS: Record<string, { base: Base; factor: number }> = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  cl: { base: 'ml', factor: 10 },
  l: { base: 'ml', factor: 1000 },
  ud: { base: 'ud', factor: 1 },
}

export function unidadMedible(unidad?: string): boolean {
  return unidad != null && EQUIVALENCIAS[normalizar(unidad)] != null
}

export function convertir(cantidad: number, desde: string, hasta: string): number | null {
  const a = EQUIVALENCIAS[normalizar(desde)]
  const b = EQUIVALENCIAS[normalizar(hasta)]
  if (!a || !b || a.base !== b.base) return null
  return redondear((cantidad * a.factor) / b.factor)
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

const FAMILIAS_CON_CANTIDAD = new Set([
  'carnes', 'pescados', 'lacteos', 'huevos',
  'verduras', 'frutas', 'cereales', 'legumbres', 'frutos secos', 'conservas',
])

export function requiereCantidad(familia: string): boolean {
  return FAMILIAS_CON_CANTIDAD.has(normalizar(familia))
}

const UNIDAD_FAMILIA: Record<string, string> = {
  huevos: 'ud', frutas: 'ud', verduras: 'ud', conservas: 'ud',
  bebidas: 'ml', caldos: 'ml',
}

export function unidadPorDefecto(familia: string): string {
  return UNIDAD_FAMILIA[normalizar(familia)] ?? 'g'
}
