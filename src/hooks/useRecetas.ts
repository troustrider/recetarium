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

export interface UltimaEdicion {
  id: string
  anterior: RecetaFormData
}

function useRecetas() {
  const [state, setState] = useState<State>({ recetas: [], loading: true, error: null })
  const [ultimaEdicion, setUltimaEdicion] = useState<UltimaEdicion | null>(null)

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

  async function actualizar(id: string, data: RecetaFormData, anterior?: RecetaFormData): Promise<boolean> {
    // Snapshot de la versión previa (la pasa el formulario, que tiene la receta completa)
    // para poder deshacer una edición accidental.
    const previa = anterior
      ?? (() => {
        const r = state.recetas.find((x) => x.id === id)
        if (!r) return undefined
        const { id: _id, favorita: _fav, ...resto } = r
        return resto
      })()
    try {
      const actualizada = await updateReceta(id, data)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? actualizada : r)),
      }))
      if (previa) setUltimaEdicion({ id, anterior: previa })
      return true
    } catch {
      return false
    }
  }

  async function deshacer(): Promise<boolean> {
    if (!ultimaEdicion) return false
    try {
      const restaurada = await updateReceta(ultimaEdicion.id, ultimaEdicion.anterior)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === restaurada.id ? restaurada : r)),
      }))
      setUltimaEdicion(null)
      return true
    } catch {
      return false
    }
  }

  function descartarDeshacer() {
    setUltimaEdicion(null)
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

  // Estable: llega como prop a las RecetaCard memoizadas.
  const alternarFavorita = useCallback(async (id: string): Promise<boolean> => {
    setState((prev) => ({
      ...prev,
      recetas: prev.recetas.map((r) => (r.id === id ? { ...r, favorita: !r.favorita } : r)),
    }))
    try {
      await toggleFavorita(id)
      return true
    } catch {
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? { ...r, favorita: !r.favorita } : r)),
      }))
      return false
    }
  }, [])

  return {
    ...state, cargar, crear, actualizar, eliminar, toggleFavorita: alternarFavorita,
    ultimaEdicion, deshacer, descartarDeshacer,
  }
}

export default useRecetas
