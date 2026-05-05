import { useState, useMemo } from 'react'
import type { Receta, Sabor } from '../types/receta'

export interface Filtros {
  categoria: string
  sabor: Sabor | ''
  tiempoMax: 15 | 30 | 60 | ''
}

const FILTROS_VACIOS: Filtros = { categoria: '', sabor: '', tiempoMax: '' }

function useFiltros(recetas: Receta[]) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)

  const recetasFiltradas = useMemo(() => {
    return recetas.filter((r) => {
      if (filtros.categoria && r.categoria !== filtros.categoria) return false
      if (filtros.sabor && r.sabor !== filtros.sabor) return false
      if (filtros.tiempoMax && r.tiempoPreparacion > filtros.tiempoMax) return false
      return true
    })
  }, [recetas, filtros])

  function resetFiltros() {
    setFiltros(FILTROS_VACIOS)
  }

  return { filtros, setFiltros, resetFiltros, recetasFiltradas }
}

export default useFiltros
