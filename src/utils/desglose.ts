import { normalizar } from './ingredientes'

export interface ParteReceta {
  receta: string
  cantidad: number
}

const FAMILIAS_DESGLOSE = new Set(['carnes', 'pescados'])

export function seDesglosa(familia: string): boolean {
  return FAMILIAS_DESGLOSE.has(normalizar(familia))
}

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
