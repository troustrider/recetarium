import { useState, useEffect } from 'react'
import type { Receta } from '../types/receta'

const API = 'http://localhost:3001/api/v1/recetas'

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

    fetch(`${API}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Receta no encontrada')
        return res.json()
      })
      .then((data: Receta) => setState({ receta: data, loading: false, error: null }))
      .catch((e: Error) => setState({ receta: null, loading: false, error: e.message }))
  }, [id])

  return state
}

export default useReceta
