// Cantidades de despensa. Sin ellas la lista de la compra solo sabe "hay o no
// hay"; con ellas sabe "hay 200 g de los 500 g que piden las recetas, compra
// 300 g".

import { normalizar } from './ingredientes'

export const UNIDADES_DESPENSA = ['g', 'kg', 'ml', 'l', 'ud'] as const

type Base = 'g' | 'ml' | 'ud'

// Solo se convierte dentro de la misma dimensión: una receta que pide "2
// cucharadas" no se puede restar de "500 ml" sin inventarse una densidad.
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

// null cuando las unidades no son comparables (distinta dimensión o unidad de
// cocina como "cucharada", "diente", "puñado").
export function convertir(cantidad: number, desde: string, hasta: string): number | null {
  const a = EQUIVALENCIAS[normalizar(desde)]
  const b = EQUIVALENCIAS[normalizar(hasta)]
  if (!a || !b || a.base !== b.base) return null
  return redondear((cantidad * a.factor) / b.factor)
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

// Familias donde la cantidad cambia la compra: se consumen por peso o por
// piezas y una sola receta se lleva una parte apreciable de lo que hay en
// casa. Las que no están aquí (especias, condimentos, salsas, bebidas, dulces)
// se compran por envase y duran semanas: basta con "de sobra / queda poco".
// Sin acentos porque las familias llegan escritas de las dos formas.
const FAMILIAS_CON_CANTIDAD = new Set([
  'carnes', 'pescados', 'lacteos', 'huevos',
  'verduras', 'frutas', 'cereales', 'legumbres', 'frutos secos', 'conservas',
])

export function requiereCantidad(familia: string): boolean {
  return FAMILIAS_CON_CANTIDAD.has(normalizar(familia))
}

// Unidad con la que se suele medir cada familia en el recetario.
const UNIDAD_FAMILIA: Record<string, string> = {
  huevos: 'ud', frutas: 'ud', verduras: 'ud', conservas: 'ud',
  bebidas: 'ml', caldos: 'ml',
}

export function unidadPorDefecto(familia: string): string {
  return UNIDAD_FAMILIA[normalizar(familia)] ?? 'g'
}
