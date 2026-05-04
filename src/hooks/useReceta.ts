import { useState, useEffect } from 'react'
import type { Receta } from '../types/receta'
import { getReceta } from '../api/client'

interface State {
  receta: Receta | null
  loading: boolean
  error: string | null
}

function useReceta(id: string) {
  const [state, setState] = useState<State>({ receta: null, loading: true, error: null })

  useEffect(() => {
    if (!id) return
    setState({ receta: null, loading: true, error: null })

    getReceta(id)
      .then((data) => setState({ receta: data, loading: false, error: null }))
      .catch((e: Error) => setState({ receta: null, loading: false, error: e.message }))
  }, [id])

  return state
}

export default useReceta
