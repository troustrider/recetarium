// Matching entre nombres de ingrediente (despensa ↔ recetas ↔ lista) y
// cálculo de disponibilidad. La comparación ignora acentos y plurales
// simples para que "tomates" case con "tomate" y "calabacines" con "calabacín".

import { normalizar, canonUnidad } from './ingredientes'
import type { Receta } from '../types/receta'

export const FAMILIAS = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lácteos',
  'cereales', 'legumbres', 'conservas', 'especias', 'salsas', 'bebidas', 'otros',
]

function formas(nombre: string): string[] {
  const n = normalizar(nombre)
  const out = [n]
  if (n.length > 3 && n.endsWith('s')) out.push(n.slice(0, -1))
  if (n.length > 4 && n.endsWith('es')) out.push(n.slice(0, -2))
  return out
}

export function mismoIngrediente(a: string, b: string): boolean {
  const fb = new Set(formas(b))
  return formas(a).some((f) => fb.has(f))
}

export function estaEnDespensa(nombre: string, despensa: { nombre: string }[]): boolean {
  return despensa.some((d) => mismoIngrediente(d.nombre, nombre))
}

// Ingredientes de la receta que no están en la despensa. Los "al gusto"
// (sal, pimienta, especias de pizca) se asumen básicos de casa y no cuentan.
export function faltantes(receta: Receta, despensa: { nombre: string }[]): string[] {
  return receta.ingredientes
    .filter((ing) => canonUnidad(ing.nombre, ing.unidad) !== 'al gusto')
    .filter((ing) => !estaEnDespensa(ing.nombre, despensa))
    .map((ing) => ing.nombre)
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
