import { useState, useEffect, useCallback } from 'react'
import type { Receta } from '../types/receta'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

const API = 'http://localhost:3001/api/v1/recetas'

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
      const res = await fetch(API)
      if (!res.ok) throw new Error('Error al cargar las recetas')
      const data: Receta[] = await res.json()
      setState({ recetas: data, loading: false, error: null })
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: (e as Error).message }))
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function crear(data: RecetaFormData): Promise<Receta | null> {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al crear la receta')
      const nueva: Receta = await res.json()
      setState((prev) => ({ ...prev, recetas: [...prev.recetas, nueva] }))
      return nueva
    } catch {
      return null
    }
  }

  async function actualizar(id: string, data: RecetaFormData): Promise<boolean> {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al actualizar la receta')
      const actualizada: Receta = await res.json()
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
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar la receta')
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.filter((r) => r.id !== id),
      }))
      return true
    } catch {
      return false
    }
  }

  async function toggleFavorita(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API}/${id}/favorita`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Error al actualizar favorita')
      const actualizada: Receta = await res.json()
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? actualizada : r)),
      }))
      return true
    } catch {
      return false
    }
  }

  return { ...state, cargar, crear, actualizar, eliminar, toggleFavorita }
}

export default useRecetas
