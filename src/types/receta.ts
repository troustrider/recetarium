export type Categoria = string

export type Sabor = 'salado' | 'dulce' | 'amargo' | 'umami' | 'acido'

export type Tipo = 'principal' | 'postre' | 'desayuno' | 'entrante'

export interface Ingrediente {
  nombre: string
  cantidad: number
  unidad: string
  familia: string
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
  precioPorPorcion?: number
  porciones?: number
  calorias?: number
  proteinas?: number
  carbohidratos?: number
  grasas?: number
  tipo?: Tipo
}
