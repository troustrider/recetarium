
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
  /** Cuántos días llevan comida de mediodía. */
  comidas: number
  /** Cuántos días llevan cena. */
  cenas: number
  limites: LimitesSemana
}

/** Los tres huecos del día que se ajustan por número de días. */
export type Hueco = 'desayunos' | 'comidas' | 'cenas'

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

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  prioridades: [],
  cocinasFavoritas: [],
  desayunos: 3,
  comidas: 0,
  cenas: 7,
  limites: LIMITES_VACIOS,
}
