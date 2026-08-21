/**
 * Cómo quiere comer esta casa. Lo guarda el hogar entero, como el plan y la
 * despensa, y es lo único que cambia el comportamiento de la auto-semana.
 *
 * Tres capas con semántica distinta a propósito:
 *
 * - `limites` excluyen: una receta que no los cumple no se cocina. Nunca se
 *   relajan por dieta, gluten ni vetos; como mucho se ensancha el tiempo.
 * - `prioridades` empujan: suben un objetivo semanal o bajan un techo. No
 *   excluyen a nadie, así que no pueden dejar la semana a medias.
 * - `cocinasFavoritas` y `desayunos` son costumbres de la casa.
 */

export type Prioridad =
  | 'proteina'
  | 'fibra'
  | 'hierro'
  | 'calcio'
  | 'b12folato'
  | 'menosSal'
  | 'menosAzucar'
  | 'menosSaturadas'
  | 'ligera'

export type Dieta = 'vegetariana' | 'vegana'

export interface LimitesSemana {
  /** Minutos como techo de lunes a viernes. `null` = sin límite. */
  tiempoMax: number | null
  /** Minutos como techo el sábado y el domingo, que es cuando hay tiempo. */
  tiempoMaxFinde: number | null
  dieta: Dieta | null
  sinGluten: boolean
  /** Ingredientes que esta semana no entran en casa. */
  vetados: string[]
}

export interface Preferencias {
  prioridades: Prioridad[]
  cocinasFavoritas: string[]
  /** Cuántos días de la semana llevan desayuno planificado. */
  desayunos: number
  /**
   * Cuántos días llevan comida de mediodía. La cena la lleva todo el mundo
   * todos los días —es lo que la auto-semana ha repartido siempre—, así que no
   * tiene ajuste: quien no cena ese día lo quita a mano.
   */
  comidas: number
  limites: LimitesSemana
}

/**
 * Tres prioridades es el tope a propósito. Con cuatro se pelean entre ellas, el
 * resultado deja de poder explicarse ("¿por qué ha entrado este plato?") y el
 * pool se estrecha tanto que la semana sale repetida.
 */
export const MAX_PRIORIDADES = 3

/** Cuatro cocinas favoritas dan de sobra para siete días sin repetir dos veces. */
export const MAX_COCINAS = 4

export const LIMITES_VACIOS: LimitesSemana = {
  tiempoMax: null,
  tiempoMaxFinde: null,
  dieta: null,
  sinGluten: false,
  vetados: [],
}

/**
 * Ninguna comida de mediodía de serie: la casa planifica cenas, y meter siete
 * comidas sin que nadie las haya pedido dobla la compra de golpe. Quien las
 * quiera las sube en "Cómo comemos".
 */
export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  prioridades: [],
  cocinasFavoritas: [],
  desayunos: 3,
  comidas: 0,
  limites: LIMITES_VACIOS,
}
