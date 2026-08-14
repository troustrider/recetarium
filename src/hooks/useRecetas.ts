import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Receta, RecetaListada } from '../types/receta'
import {
  getRecetas,
  createReceta,
  updateReceta,
  deleteReceta,
  restoreReceta,
  toggleFavorita,
} from '../api/client'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

interface State {
  recetas: RecetaListada[]
  loading: boolean
  error: string | null
}

export interface UltimaEdicion {
  id: string
  anterior: RecetaFormData
}

const porNombre = (a: RecetaListada, b: RecetaListada) => a.nombre.localeCompare(b.nombre)

// El catálogo viene ordenado del servidor y el índice alfabético cuenta con ello:
// una receta nueva al final de la lista queda fuera de su letra hasta recargar.
const insertarOrdenada = (recetas: RecetaListada[], nueva: RecetaListada) =>
  [...recetas, nueva].sort(porNombre)

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

  const crear = useCallback(async (data: RecetaFormData): Promise<Receta | null> => {
    try {
      const nueva = await createReceta(data)
      setState((prev) => ({ ...prev, recetas: insertarOrdenada(prev.recetas, nueva) }))
      return nueva
    } catch {
      return null
    }
  }, [])

  const actualizar = useCallback(async (id: string, data: RecetaFormData, anterior: RecetaFormData): Promise<boolean> => {
    try {
      const actualizada = await updateReceta(id, data)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === id ? actualizada : r)).sort(porNombre),
      }))
      setUltimaEdicion({ id, anterior })
      return true
    } catch {
      return false
    }
  }, [])

  const deshacer = useCallback(async (): Promise<boolean> => {
    if (!ultimaEdicion) return false
    try {
      const restaurada = await updateReceta(ultimaEdicion.id, ultimaEdicion.anterior)
      setState((prev) => ({
        ...prev,
        recetas: prev.recetas.map((r) => (r.id === restaurada.id ? restaurada : r)).sort(porNombre),
      }))
      setUltimaEdicion(null)
      return true
    } catch {
      return false
    }
  }, [ultimaEdicion])

  const descartarDeshacer = useCallback(() => {
    setUltimaEdicion(null)
  }, [])

  const eliminar = useCallback(async (id: string): Promise<boolean> => {
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
  }, [])

  const restaurar = useCallback(async (id: string): Promise<boolean> => {
    try {
      const receta = await restoreReceta(id)
      setState((prev) =>
        prev.recetas.some((r) => r.id === receta.id)
          ? prev
          : { ...prev, recetas: insertarOrdenada(prev.recetas, receta) }
      )
      return true
    } catch {
      return false
    }
  }, [])

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

  return useMemo(
    () => ({
      ...state, cargar, crear, actualizar, eliminar, restaurar, toggleFavorita: alternarFavorita,
      ultimaEdicion, deshacer, descartarDeshacer,
    }),
    [
      state, cargar, crear, actualizar, eliminar, restaurar, alternarFavorita,
      ultimaEdicion, deshacer, descartarDeshacer,
    ]
  )
}

export default useRecetas
