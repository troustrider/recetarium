import { canonUnidad, ingredientesDe } from './ingredientes'
import { convertir, redondear, unidadMedible } from './cantidades'
import { elegirDeDespensa, stockInicial } from './despensa'
import { racionesBase } from '../hooks/useListaCompra'
import type { RecetaListada } from '../types/receta'

interface EntradaCocinada {
  receta: RecetaListada
  raciones: number
  conGuarnicion?: boolean
}

interface ItemDespensa {
  nombre: string
  familia: string
  estado?: string
  caducidad?: string
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
  const restante = stockInicial(despensa)
  const tocados = new Map<number, { usadoPor: string[]; agotado: boolean }>()

  for (const { receta, raciones, conGuarnicion } of entradas) {
    const factor = raciones / racionesBase(receta)
    for (const ing of ingredientesDe(receta, conGuarnicion)) {
      const unidad = canonUnidad(ing.nombre, ing.unidad)
      if (!unidadMedible(unidad)) continue

      const idx = elegirDeDespensa(despensa, restante, {
        nombre: ing.nombre,
        cantidad: ing.cantidad * factor,
        unidad,
      })
      if (idx === -1) continue

      const stock = restante[idx]
      const gasto = stock == null ? null : convertir(ing.cantidad * factor, unidad, despensa[idx].unidad!)
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
