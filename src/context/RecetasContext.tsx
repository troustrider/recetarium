import { createContext, useContext, type ReactNode } from 'react'
import useRecetas, { type UltimaEdicion } from '../hooks/useRecetas'
import type { Receta } from '../types/receta'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

interface RecetasContextValue {
  recetas: Receta[]
  loading: boolean
  error: string | null
  cargar: () => void
  crear: (data: RecetaFormData) => Promise<Receta | null>
  actualizar: (id: string, data: RecetaFormData, anterior?: RecetaFormData) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
  toggleFavorita: (id: string) => Promise<boolean>
  ultimaEdicion: UltimaEdicion | null
  deshacer: () => Promise<boolean>
  descartarDeshacer: () => void
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
