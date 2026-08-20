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

/**
 * Cuánto vale gastar cada cosa esta semana. Dos motivos distintos que la
 * auto-semana trataba igual —o sea, no trataba—:
 *
 * - **Lo que se va a echar a perder.** Un paquete abierto o una fecha encima
 *   es comida que se tira si no entra en el plan. Manda sobre todo lo demás.
 * - **El fondo de despensa.** El bote de garbanzos y el paquete de arroz no
 *   corren prisa, pero están pagados: una semana que los usa es una compra más
 *   corta. Pesa poco a propósito, lo justo para desempatar entre dos platos
 *   parecidos, nunca para imponer uno peor.
 */
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

  // Una fecha lejana no dice nada: desde que la despensa seca también estima
  // caducidad, el bote de garbanzos trae fecha para dentro de dos años. Así que
  // la fecha manda solo mientras aprieta, y a partir de ahí decide qué es.
  const porFecha =
    dias == null ? null
    : dias <= 1 ? PESO.urgente
    : dias <= UMBRAL_CADUCIDAD_DIAS ? PESO.pronto
    : dias <= 7 ? PESO.proximo
    : null

  // Un paquete abierto sin fecha no es menos urgente por no tenerla: se abrió,
  // y lo que no se sabe es cuándo. Con fecha ya la lleva recortada por
  // `caducidadAlAbrir`, así que ahí manda la fecha.
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

/**
 * La despensa vista como "qué merece la pena gastar", ya sin lo que no se come.
 * Se resuelve una vez por semana y no por plato: quien la use habla de índices,
 * no de nombres, para poder contar una sola vez el mismo bote aunque lo pidan
 * dos platos distintos.
 */
export function indiceDespensa(despensa: ItemAprovechable[]): IndiceDespensa {
  const items = despensa.filter((item) => !esDeHogar(item))
  return { items, pesos: items.map(pesoDe) }
}

/**
 * Qué ítems de la despensa gasta una receta, con su guarnición puesta, que es
 * como la auto-semana la planifica. La sal y la pimienta quedan fuera: están en
 * todas las casas y en todas las recetas, así que puntuarlas no distingue nada.
 */
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
