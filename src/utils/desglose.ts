// Reparto por plato de un ingrediente que se compra junto. Sirve para lo que
// se congela en porciones: si el pollo de la semana va a dos platos, interesa
// saber cuánto es de cada uno para meterlo en bolsas separadas y descongelar
// solo lo de esa cena.

import { normalizar } from './ingredientes'

export interface ParteReceta {
  receta: string
  cantidad: number
}

// Familias que se compran en pieza y se congelan por raciones. El resto se
// guarda entero en la nevera o la despensa y desglosarlo no aporta nada.
const FAMILIAS_DESGLOSE = new Set(['carnes', 'pescados'])

export function seDesglosa(familia: string): boolean {
  return FAMILIAS_DESGLOSE.has(normalizar(familia))
}

// Lo que ya hay en casa cubre los primeros platos y no se compra: se descuenta
// en orden, igual que hace repartirDespensa con el stock. Lo que queda es lo
// que hay que comprar y embolsar para cada plato.
export function repartirPorReceta(partes: ParteReceta[], yaCubierto = 0): ParteReceta[] {
  let restante = yaCubierto
  const out: ParteReceta[] = []
  for (const parte of partes) {
    if (restante <= 0) {
      out.push(parte)
      continue
    }
    if (restante >= parte.cantidad) {
      restante -= parte.cantidad
      continue
    }
    out.push({ receta: parte.receta, cantidad: Math.round((parte.cantidad - restante) * 100) / 100 })
    restante = 0
  }
  return out
}
