import type { RecetaListada } from '../types/receta'
import { canonUnidad, ingredientesDe } from './ingredientes'
import { despensaCubre, esDeHogar, diasHastaCaducidad, UMBRAL_CADUCIDAD_DIAS } from './despensa'
import { esNoPerecedero } from './caducidadEstimada'

export interface ItemAprovechable {
  nombre: string
  familia: string
  estado?: string
  caducidad?: string
  abierto?: string
}

const PESO = {
  urgente: 1,    // caducado, o caduca hoy o mañana
  pronto: 0.8,   // dentro del umbral de aviso, o paquete abierto
  proximo: 0.45, // caduca dentro de la semana
  poco: 0.3,     // queda poco: terminarlo libera un hueco
  fondo: 0.25,   // no perecedero que ya está en casa
  fresco: 0.15,  // perecedero con tiempo de sobra por delante
}

function pesoDe(item: ItemAprovechable): number {
  const dias = item.caducidad != null ? diasHastaCaducidad(item.caducidad) : null

  const porFecha =
    dias == null ? null
    : dias <= 1 ? PESO.urgente
    : dias <= UMBRAL_CADUCIDAD_DIAS ? PESO.pronto
    : dias <= 7 ? PESO.proximo
    : null

  const base =
    porFecha ??
    (item.abierto != null
      ? PESO.pronto
      : esNoPerecedero(item.nombre, item.familia)
        ? PESO.fondo
        : PESO.fresco)

  return item.estado === 'poco' ? Math.max(base, PESO.poco) : base
}

export interface IndiceDespensa {
  /** Lo que hay en casa y se come, en el orden de la despensa. */
  items: ItemAprovechable[]
  /** Cuánto vale gastar cada uno, en el mismo orden. */
  pesos: number[]
}

export function indiceDespensa(despensa: ItemAprovechable[]): IndiceDespensa {
  const items = despensa.filter((item) => !esDeHogar(item))
  return { items, pesos: items.map(pesoDe) }
}

export function aprovechaDe(receta: RecetaListada, indice: IndiceDespensa): number[] {
  const ingredientes = ingredientesDe(receta, true).filter(
    (ing) => canonUnidad(ing.nombre, ing.unidad) !== 'al gusto'
  )
  if (ingredientes.length === 0) return []

  const usados: number[] = []
  for (let i = 0; i < indice.items.length; i++) {
    if (ingredientes.some((ing) => despensaCubre(indice.items[i].nombre, ing.nombre))) usados.push(i)
  }
  return usados
}
