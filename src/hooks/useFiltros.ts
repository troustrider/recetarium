import { useState, useMemo } from 'react'
import type { Receta, Sabor } from '../types/receta'

export interface Filtros {
  categoria: string
  sabor: Sabor | ''
  tiempoMax: 15 | 30 | 60 | ''
}

export type Orden = 'nombre' | 'tiempo' | 'proteina' | 'precio'

const FILTROS_VACIOS: Filtros = { categoria: '', sabor: '', tiempoMax: '' }

function useFiltros(recetas: Receta[]) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [orden, setOrden] = useState<Orden>('nombre')

  const recetasFiltradas = useMemo(() => {
    const filtradas = recetas.filter((r) => {
      if (filtros.categoria && r.categoria !== filtros.categoria) return false
      if (filtros.sabor && r.sabor !== filtros.sabor) return false
      if (filtros.tiempoMax && r.tiempoPreparacion > filtros.tiempoMax) return false
      return true
    })
    const cmp: Record<Orden, (a: Receta, b: Receta) => number> = {
      nombre: (a, b) => a.nombre.localeCompare(b.nombre),
      tiempo: (a, b) => a.tiempoPreparacion - b.tiempoPreparacion,
      proteina: (a, b) => (b.proteinas ?? -1) - (a.proteinas ?? -1),
      precio: (a, b) => (a.precioPorPorcion ?? Infinity) - (b.precioPorPorcion ?? Infinity),
    }
    return [...filtradas].sort(cmp[orden])
  }, [recetas, filtros, orden])

  function resetFiltros() {
    setFiltros(FILTROS_VACIOS)
  }

  return { filtros, setFiltros, orden, setOrden, resetFiltros, recetasFiltradas }
}

export default useFiltros
