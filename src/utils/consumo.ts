// Qué sale de la despensa cuando un plato del planificador ya está hecho. Es
// la operación inversa de repartirDespensa(): allí el stock decide qué NO se
// compra, aquí decide qué se descuenta y qué se queda a medias.
//
// Dos cautelas para no vaciar la despensa de más:
//   - las unidades de cocina ("2 cucharadas", "1 diente") no gastan nada: son
//     una pizca de un envase que dura semanas;
//   - un stock con cantidad guardada solo se toca si la unidad es comparable
//     (no se resta "2 ud" de "500 ml").

import { canonUnidad, ingredientesDe } from './ingredientes'
import { convertir, redondear, unidadMedible } from './cantidades'
import { despensaCubre } from './despensa'
import { racionesBase } from '../hooks/useListaCompra'
import type { Receta } from '../types/receta'

export interface EntradaCocinada {
  receta: Receta
  raciones: number
  /** Si el plato se hizo con su guarnición, también se gasta lo suyo. */
  conGuarnicion?: boolean
}

interface ItemDespensa {
  nombre: string
  familia: string
  cantidad?: number
  unidad?: string
}

export interface ConsumoIngrediente {
  nombre: string // tal cual está escrito en la despensa
  familia: string
  usadoPor: string[] // ingredientes de la receta que lo gastan
  accion: 'quitar' | 'restar'
  cantidad?: number // lo que queda tras cocinar; solo en 'restar'
  unidad?: string
}

export function consumoAlCocinar(
  entradas: EntradaCocinada[],
  despensa: ItemDespensa[]
): ConsumoIngrediente[] {
  const restante = despensa.map((d) =>
    typeof d.cantidad === 'number' && unidadMedible(d.unidad) ? d.cantidad : null
  )
  // Insertion order = orden de los ingredientes de la receta, que es como se
  // lee después en el aviso.
  const tocados = new Map<number, { usadoPor: string[]; agotado: boolean }>()

  for (const { receta, raciones, conGuarnicion } of entradas) {
    const factor = raciones / racionesBase(receta)
    for (const ing of ingredientesDe(receta, conGuarnicion)) {
      const unidad = canonUnidad(ing.nombre, ing.unidad)
      if (!unidadMedible(unidad)) continue

      const idx = despensa.findIndex((d) => despensaCubre(d.nombre, ing.nombre))
      if (idx === -1) continue

      const stock = restante[idx]
      const gasto = stock == null ? null : convertir(ing.cantidad * factor, unidad, despensa[idx].unidad!)
      // Con cantidad guardada pero incomparable no hay nada fiable que hacer.
      if (stock != null && gasto == null) continue

      const acc = tocados.get(idx) ?? { usadoPor: [], agotado: false }
      if (!acc.usadoPor.includes(ing.nombre)) acc.usadoPor.push(ing.nombre)
      if (stock == null) acc.agotado = true
      else restante[idx] = redondear(Math.max(0, stock - gasto!))
      tocados.set(idx, acc)
    }
  }

  return [...tocados].map(([idx, { usadoPor, agotado }]) => {
    const d = despensa[idx]
    const queda = restante[idx]
    return agotado || queda == null || queda <= 0
      ? { nombre: d.nombre, familia: d.familia, usadoPor, accion: 'quitar' as const }
      : { nombre: d.nombre, familia: d.familia, usadoPor, accion: 'restar' as const, cantidad: queda, unidad: d.unidad }
  })
}
