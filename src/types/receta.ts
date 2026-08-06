export type Categoria = string

export type Sabor = 'salado' | 'dulce' | 'amargo' | 'umami' | 'acido'

export type Tipo = 'principal' | 'postre' | 'desayuno' | 'entrante'

export interface Ingrediente {
  nombre: string
  cantidad: number
  unidad: string
  familia: string
}

export interface FuenteGluten {
  nombre: string
  certeza: 'si' | 'depende'
  sustituto: string | null
}

/** Micronutrientes por porción. Los calcula el servidor desde los ingredientes. */
export interface Micros {
  fibra: number
  azucares: number
  saturadas: number
  /** Sal de los ingredientes; no cuenta la que se añada al cocinar. */
  sal: number
  /** Parte del hierro que es hemo (carne, pescado): se absorbe mucho mejor. */
  hierroHemo: number
  vitaminaC: number
  calcio: number
  b12: number
  folato: number
  gluten: { fuentes: FuenteGluten[]; evitable: boolean } | null
  estimadoDe: 'completo' | 'parcial'
}

export interface Receta {
  id: string
  nombre: string
  categoria: Categoria
  sabor: Sabor
  tiempoPreparacion: number
  favorita: boolean
  imagen?: string
  ingredientes: Ingrediente[]
  pasos: string[]
  consejos?: string[]
  precioPorPorcion?: number
  porciones?: number
  calorias?: number
  proteinas?: number
  carbohidratos?: number
  grasas?: number
  /** Hierro mg/porción. */
  hierro?: number
  /** null = algún ingrediente sin ficha, así que no se puede afirmar que no lleve. */
  sinGluten?: boolean | null
  micros?: Micros
  tipo?: Tipo
}
