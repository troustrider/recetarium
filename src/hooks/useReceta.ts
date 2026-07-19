import { useState, useEffect, useCallback } from 'react'
import type { Receta } from '../types/receta'
import { getReceta } from '../api/client'

interface State {
  receta: Receta | null
  loading: boolean
  error: string | null
}

function useReceta(id: string) {
  const [state, setState] = useState<State>({ receta: null, loading: true, error: null })
  const [prevId, setPrevId] = useState(id)

  if (prevId !== id) {
    setPrevId(id)
    setState({ receta: null, loading: true, error: null })
  }

  const recargar = useCallback(() => {
    if (!id) return
    getReceta(id)
      .then((data) => setState({ receta: data, loading: false, error: null }))
      .catch((e: Error) => setState({ receta: null, loading: false, error: e.message }))
  }, [id])

  useEffect(() => { recargar() }, [recargar])

  return { ...state, recargar }
}

export default useReceta
