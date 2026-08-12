import { useState, useMemo } from 'react'
import type { Receta, Sabor } from '../types/receta'
import { normalizar } from '../utils/ingredientes'
import { despensaCubre } from '../utils/despensa'

export interface Filtros {
  categoria: string
  sabor: Sabor | ''
  tiempoMax: 15 | 30 | 60 | ''
  ingrediente: string
  sinGluten: boolean
}

export type Orden = 'nombre' | 'tiempo' | 'proteina' | 'precio' | 'hierro'

const FILTROS_VACIOS: Filtros = { categoria: '', sabor: '', tiempoMax: '', ingrediente: '', sinGluten: false }

function llevaIngrediente(receta: Receta, buscado: string): boolean {
  const q = normalizar(buscado)
  return receta.ingredientes.some(
    (i) => normalizar(i.nombre).includes(q) || despensaCubre(buscado, i.nombre)
  )
}

function useFiltros(recetas: Receta[]) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [orden, setOrden] = useState<Orden>('nombre')

  const recetasFiltradas = useMemo(() => {
    const filtradas = recetas.filter((r) => {
      if (filtros.categoria && r.categoria !== filtros.categoria) return false
      if (filtros.sabor && r.sabor !== filtros.sabor) return false
      if (filtros.tiempoMax && r.tiempoPreparacion > filtros.tiempoMax) return false
      if (filtros.ingrediente.trim() && !llevaIngrediente(r, filtros.ingrediente.trim())) return false
      if (filtros.sinGluten && r.sinGluten !== true) return false
      return true
    })
    const cmp: Record<Orden, (a: Receta, b: Receta) => number> = {
      nombre: (a, b) => a.nombre.localeCompare(b.nombre),
      tiempo: (a, b) => a.tiempoPreparacion - b.tiempoPreparacion,
      proteina: (a, b) => (b.proteinas ?? -1) - (a.proteinas ?? -1),
      precio: (a, b) => (a.precioPorPorcion ?? Infinity) - (b.precioPorPorcion ?? Infinity),
      hierro: (a, b) => (b.hierro ?? -1) - (a.hierro ?? -1),
    }
    return [...filtradas].sort(cmp[orden])
  }, [recetas, filtros, orden])

  function resetFiltros() {
    setFiltros(FILTROS_VACIOS)
  }

  return { filtros, setFiltros, orden, setOrden, resetFiltros, recetasFiltradas }
}

export default useFiltros
