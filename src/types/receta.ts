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

/**
 * Acompañamiento opcional del plato. Va en su propio bloque y no dentro de
 * `ingredientes` porque la nutrición del plato se calcula desde ese array: un
 * arroz de guarnición ahí dentro marcaría la receta entera como con gluten
 * aunque no la prepares. Su nutrición la calcula el servidor al guardar.
 */
export interface Guarnicion {
  nombre: string
  ingredientes: Ingrediente[]
  pasos: string[]
  calorias?: number
  proteinas?: number
  carbohidratos?: number
  grasas?: number
  hierro?: number
  sinGluten?: boolean | null
  micros?: Micros
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
  /** null o ausente = el plato no lleva guarnición. */
  guarnicion?: Guarnicion | null
}
