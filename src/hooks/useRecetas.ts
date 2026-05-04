import { useState, useEffect, useCallback } from 'react'
import type { Receta } from '../types/receta'
import {
  getRecetas,
  createReceta,
  updateReceta,
  deleteReceta,
  toggleFavorita,
} from '../api/client'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

interface State {
  recetas: Receta[]
  loading: boolean
  error: string | null
}

function useRecetas() {
  const [state, setState] = useState<State>({ recetas: [], loading: true, error: null })

  const cargar = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await getRecetas()
      setState({ recetas: data, loading: false, error: null })
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: (e as Error).message }))
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function crear(data: RecetaFormData): Promise<Receta | null> {
    try {
      const nueva = await createReceta(data)
      setState((prev) => ({ ...prev, recetas: [...prev.recetas, nueva] }))
      return nueva
    } catch {
      return null
    }
  }

  async function actualizar(id: string, data: RecetaFormData): Promise<boolean> {
    try {
      const actualizada = await updateReceta(id, data)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? actualizada : r)),
      }))
      return true
    } catch {
      return false
    }
  }

  async function eliminar(id: string): Promise<boolean> {
    try {
      await deleteReceta(id)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.filter((r) => r.id !== id),
      }))
      return true
    } catch {
      return false
    }
  }

  async function alternarFavorita(id: string): Promise<boolean> {
    try {
      const actualizada = await toggleFavorita(id)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? actualizada : r)),
      }))
      return true
    } catch {
      return false
    }
  }

  return { ...state, cargar, crear, actualizar, eliminar, toggleFavorita: alternarFavorita }
}

export default useRecetas
