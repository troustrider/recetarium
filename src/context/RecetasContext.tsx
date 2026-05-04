import { createContext, useContext, type ReactNode } from 'react'
import useRecetas from '../hooks/useRecetas'
import type { Receta } from '../types/receta'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

interface RecetasContextValue {
  recetas: Receta[]
  loading: boolean
  error: string | null
  cargar: () => void
  crear: (data: RecetaFormData) => Promise<Receta | null>
  actualizar: (id: string, data: RecetaFormData) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
  toggleFavorita: (id: string) => Promise<boolean>
}

const RecetasContext = createContext<RecetasContextValue | null>(null)

export function RecetasProvider({ children }: { children: ReactNode }) {
  const value = useRecetas()
  return <RecetasContext.Provider value={value}>{children}</RecetasContext.Provider>
}

export function useRecetasContext() {
  const ctx = useContext(RecetasContext)
  if (!ctx) throw new Error('useRecetasContext debe usarse dentro de RecetasProvider')
  return ctx
}
