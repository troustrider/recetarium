import { useState, useMemo } from 'react'
import type { Receta, Sabor } from '../types/receta'

export interface Filtros {
  categoria: string
  sabor: Sabor | ''
}

const FILTROS_VACIOS: Filtros = { categoria: '', sabor: '' }

function useFiltros(recetas: Receta[]) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)

  const recetasFiltradas = useMemo(() => {
    return recetas.filter((r) => {
      if (filtros.categoria && r.categoria !== filtros.categoria) return false
      if (filtros.sabor && r.sabor !== filtros.sabor) return false
      return true
    })
  }, [recetas, filtros])

  function resetFiltros() {
    setFiltros(FILTROS_VACIOS)
  }

  return { filtros, setFiltros, resetFiltros, recetasFiltradas }
}

export default useFiltros
