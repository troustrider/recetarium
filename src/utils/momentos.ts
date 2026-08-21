import type { RecetaListada, Tipo } from '../types/receta'

/**
 * Los tres huecos de comer del día. Hasta ahora el plan solo distinguía dos, y
 * ni siquiera de forma explícita: lo que no era `tipo: 'desayuno'` era la cena,
 * porque es lo único que la auto-semana repartía. El momento lo dice la entrada
 * del plan y no la receta, que es la diferencia importante: una tortilla de
 * patatas es la misma receta a mediodía y por la noche, y quién decide cuándo
 * se come es la semana, no el recetario.
 */
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

/**
 * Dónde cae una receta cuando nadie lo ha dicho. Los desayunos, en su hueco;
 * todo lo demás en la cena, que es lo que el planificador ha estado repartiendo
 * desde el principio: así un plan guardado antes de que existiera el hueco de
 * comida se lee hoy exactamente como se leía ayer.
 */
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
