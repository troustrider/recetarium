import type { RecetaListada, Tipo } from '../types/receta'

export const MOMENTOS = ['desayuno', 'comida', 'cena'] as const

export type Momento = typeof MOMENTOS[number]

export const NOMBRE_MOMENTO: Record<Momento, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
}

/** Para ordenar el día como se vive: desayuno, comida y cena. */
export const ORDEN_MOMENTO: Record<Momento, number> = { desayuno: 0, comida: 1, cena: 2 }

export const esMomento = (valor: unknown): valor is Momento =>
  typeof valor === 'string' && (MOMENTOS as readonly string[]).includes(valor)

export function momentoPorDefecto(tipo?: Tipo): Momento {
  return tipo === 'desayuno' ? 'desayuno' : 'cena'
}

export function momentoDe(entrada: { momento?: Momento; receta: Pick<RecetaListada, 'tipo'> }): Momento {
  return entrada.momento ?? momentoPorDefecto(entrada.receta.tipo)
}

/** El siguiente en la rueda, para cambiar de momento de un toque en el chip. */
export function siguienteMomento(momento: Momento): Momento {
  return MOMENTOS[(MOMENTOS.indexOf(momento) + 1) % MOMENTOS.length]
}

export const TOPE_CENA = { calorias: 950, grasas: 35 } as const

type ConMacros = Pick<RecetaListada, 'calorias' | 'grasas' | 'guarnicion'>

export function cabeDeNoche(receta: ConMacros): boolean {
  const calorias = (receta.calorias ?? 0) + (receta.guarnicion?.calorias ?? 0)
  const grasas = (receta.grasas ?? 0) + (receta.guarnicion?.grasas ?? 0)
  return calorias <= TOPE_CENA.calorias && grasas <= TOPE_CENA.grasas
}
