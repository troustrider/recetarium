import { useMemo } from 'react'
import { useRecetasContext } from '../context'
import { normalizar } from '../utils/ingredientes'

export interface IngredienteConocido {
  nombre: string
  familia: string
}

function useIngredientesConocidos(): IngredienteConocido[] {
  const { recetas } = useRecetasContext()
  return useMemo(() => {
    const mapa = new Map<string, IngredienteConocido>()
    for (const r of recetas) {
      for (const ing of r.ingredientes) {
        const k = normalizar(ing.nombre)
        if (!mapa.has(k)) mapa.set(k, { nombre: ing.nombre.trim().toLowerCase(), familia: ing.familia || 'otros' })
      }
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [recetas])
}

export default useIngredientesConocidos
