export type Categoria = string

export type Sabor = 'salado' | 'dulce' | 'amargo' | 'umami'

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
  ingredientes: Ingrediente[]
  pasos: string[]
}
