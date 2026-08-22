type Categoria = string

export type Sabor = 'salado' | 'dulce' | 'amargo' | 'umami' | 'acido'

export type Tipo = 'principal' | 'postre' | 'desayuno' | 'entrante'

export interface Ingrediente {
  nombre: string
  cantidad: number
  unidad: string
  familia: string
}

interface FuenteGluten {
  nombre: string
  certeza: 'si' | 'depende'
  sustituto: string | null
}

export interface Micros {
  fibra: number
  azucares: number
  saturadas: number
  sal: number
  hierroHemo: number
  vitaminaC: number
  calcio: number
  b12: number
  folato: number
  gluten: { fuentes: FuenteGluten[]; evitable: boolean } | null
  estimadoDe: 'completo' | 'parcial'
}

type OrigenAnimal = 'carne' | 'pescado' | 'lacteo' | 'huevo' | 'miel'

interface FuenteAnimal {
  nombre: string
  origen: OrigenAnimal
  certeza: 'si' | 'depende'
}

export interface Apto {
  vegetariana: boolean | null
  vegana: boolean | null
  animal: FuenteAnimal[]
}

interface Guarnicion {
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
  apto?: Apto | null
}

export type RecetaListada = Omit<Receta, 'pasos' | 'consejos' | 'guarnicion'> & {
  guarnicion?: Omit<Guarnicion, 'pasos'> | null
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
  hierro?: number
  sinGluten?: boolean | null
  micros?: Micros
  apto?: Apto | null
  tipo?: Tipo
  guarnicion?: Guarnicion | null
}
